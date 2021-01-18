(ns metabase.test.data.odps
  (:require [clojure.java.jdbc :as jdbc]
            [metabase.driver.sql-jdbc.connection :as sql-jdbc.conn]
            [metabase.test.data
             [interface :as tx]
             [sql :as sql.tx]
             [sql-jdbc :as sql-jdbc.tx]]
            [metabase.test.data.sql-jdbc
             [execute :as execute]
             [load-data :as load-data]]
            [metabase.util :as u]))

(sql-jdbc.tx/add-test-extensions! :odps)

(defonce ^:private session-schema-number (rand-int 200))
(defonce           session-schema        (str "CAM_" session-schema-number))
(defonce ^:private session-password      (apply str (repeatedly 16 #(rand-nth (map char (range (int \a) (inc (int \z))))))))
;; Session password is only used when creating session user, not anywhere else

(def ^:private connection-details
  (delay
   {:host     (tx/db-test-env-var-or-throw :odps :host)
    :project  (tx/db-test-env-var-or-throw :odps :project)
    :user     (tx/db-test-env-var-or-throw :odps :user)
    :password (tx/db-test-env-var-or-throw :odps :password)}))

(defmethod tx/dbdef->connection-details :odps [& _] @connection-details)

(defmethod tx/sorts-nil-first? :odps [_] false)

(defmethod sql.tx/field-base-type->sql-type [:odps :type/BigInteger] [_ _] "NUMBER(*,0)")
(defmethod sql.tx/field-base-type->sql-type [:odps :type/Boolean]    [_ _] "NUMBER(1)")
(defmethod sql.tx/field-base-type->sql-type [:odps :type/Date]       [_ _] "DATE")
(defmethod sql.tx/field-base-type->sql-type [:odps :type/DateTime]   [_ _] "TIMESTAMP")
(defmethod sql.tx/field-base-type->sql-type [:odps :type/Decimal]    [_ _] "DECIMAL")
(defmethod sql.tx/field-base-type->sql-type [:odps :type/Float]      [_ _] "BINARY_FLOAT")
(defmethod sql.tx/field-base-type->sql-type [:odps :type/Integer]    [_ _] "INTEGER")
(defmethod sql.tx/field-base-type->sql-type [:odps :type/Text]       [_ _] "VARCHAR2(4000)")

;; If someone tries to run Time column tests with odps give them a heads up that odps does not support it
(defmethod sql.tx/field-base-type->sql-type [:odps :type/Time] [_ _]
  (throw (UnsupportedOperationException. "odps does not have a TIME data type.")))

(defmethod sql.tx/drop-table-if-exists-sql :odps [_ {:keys [database-name]} {:keys [table-name]}]
  (format "BEGIN
             EXECUTE IMMEDIATE 'DROP TABLE \"%s\".\"%s\" CASCADE CONSTRAINTS'⅋
           EXCEPTION
             WHEN OTHERS THEN
               IF SQLCODE != -942 THEN
                 RAISE⅋
               END IF⅋
           END⅋"
          session-schema
          (tx/db-qualified-table-name database-name table-name)))

(defmethod tx/expected-base-type->actual :odps [_ base-type]
  ;; odps doesn't have INTEGERs
  (if (isa? base-type :type/Integer)
    :type/Decimal
    base-type))

(defmethod sql.tx/create-db-sql :odps [& _] nil)

(defmethod sql.tx/drop-db-if-exists-sql :odps [& _] nil)

(defmethod execute/execute-sql! :odps [& args]
  (apply execute/sequentially-execute-sql! args))

;; Now that connections are reüsed doing this sequentially actually seems to be faster than parallel
(defmethod load-data/load-data! :odps [& args]
  (apply load-data/load-data-one-at-a-time! args))

(defmethod sql.tx/pk-sql-type :odps [_]
  "INTEGER GENERATED BY DEFAULT AS IDENTITY (START WITH 1 INCREMENT BY 1) NOT NULL")

(defmethod sql.tx/qualified-name-components :odps [& args]
  (apply tx/single-db-qualified-name-components session-schema args))

(defmethod tx/id-field-type :odps [_] :type/Decimal)

(defmethod tx/has-questionable-timezone-support? :odps [_] true)


;;; --------------------------------------------------- Test Setup ---------------------------------------------------

(defn- dbspec [& _]
  (sql-jdbc.conn/connection-details->spec :odps @connection-details))

(defn- non-session-schemas
  "Return a set of the names of schemas (users) that are not meant for use in this test session (i.e., ones that should
  be ignored). (This is used as part of the implementation of `excluded-schemas` for the odps driver during tests.)"
  []
  (set (map :username (jdbc/query (dbspec) ["SELECT username FROM dba_users WHERE username <> ?" session-schema]))))


;;; Clear out the sesion schema before and after tests run
;; TL;DR odps schema == odps user. Create new user for session-schema
(defn- execute! [format-string & args]
  (let [sql (apply format format-string args)]
    (println (u/format-color 'blue "[odps] %s" sql))
    (jdbc/execute! (dbspec) sql))
  (println (u/format-color 'blue "[ok]")))

(defn- clean-session-schemas! []
  "Delete any old session users that for some reason or another were never deleted. For REPL usage."
  (doseq [schema (non-session-schemas)
          :when  (re-find #"^CAM_" schema)]
    (execute! "DROP USER %s CASCADE" schema)))

(defn create-user!
  ;; default to using session-password for all users created this session
  ([username]
   (create-user! username session-password))
  ([username password]
   (execute! "CREATE USER %s IDENTIFIED BY %s DEFAULT TABLESPACE USERS QUOTA UNLIMITED ON USERS"
             username
             password)))

(defn drop-user! [username]
  (u/ignore-exceptions
   (execute! "DROP USER %s CASCADE" username)))

(defmethod tx/before-run :odps [_]
  (drop-user! session-schema)
  (create-user! session-schema))

(defmethod tx/after-run :odps [_]
  (drop-user! session-schema))
