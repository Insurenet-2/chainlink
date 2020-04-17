package cltest

import (
	"database/sql"
	"fmt"
	"net/url"

	"github.com/DATA-DOG/go-txdb"
	"github.com/jinzhu/gorm"
	"github.com/smartcontractkit/chainlink/core/gracefulpanic"
	"github.com/smartcontractkit/chainlink/core/store/migrations"
	"github.com/smartcontractkit/chainlink/core/store/orm"
)

// PrepareTestDB destroys, creates and migrates the test database.
func PrepareTestDB(tc *TestConfig) func() {
	panic("PrepareTestDB")
	t := tc.t
	t.Helper()

	// parsed, err := url.Parse(tc.DatabaseURL())
	// if err != nil {
	//     t.Fatalf("unable to extract database from %v: %v", tc.DatabaseURL(), err)
	// }

	// dropAndCreateTestDB(t, parsed)
	// migrateTestDB(tc)

	// return nil
	return func() {}
}

func GlobalPrepareTestDB(config *orm.Config) error {
	parsed, err := url.Parse(config.DatabaseURL())
	if err != nil {
		return err
	}

	err = dropAndCreateTestDB(parsed)
	if err != nil {
		return err
	}
	err = migrateTestDB(config)
	if err != nil {
		return err
	}

	// Register txdb as dialect wrapping postgres
	// See: DialectTransactionWrappedPostgres
	txdb.Register("cloudsqlpostgres", "postgres", config.DatabaseURL())
}

func dropAndCreateTestDB(parsed *url.URL) error {
	dbname := parsed.Path[1:]
	// Cannot drop test database if we are connected to it, so we must connect
	// to a different one. template1 should be present on all postgres installations
	parsed.Path = "/template1"
	db, err := sql.Open(string(orm.DialectPostgres), parsed.String())
	if err != nil {
		return fmt.Errorf("unable to open postgres database for creating test db: %+v", err)
	}
	defer db.Close()

	_, err = db.Exec(fmt.Sprintf("DROP DATABASE IF EXISTS %s", dbname))
	if err != nil {
		return fmt.Errorf("unable to drop postgres test database: %v", err)
	}
	// `CREATE DATABASE $1` does not seem to work w CREATE DATABASE
	_, err = db.Exec(fmt.Sprintf("CREATE DATABASE %s", dbname))
	if err != nil {
		return fmt.Errorf("unable to create postgres test database: %v", err)
	}
	return nil
}

func migrateTestDB(config *orm.Config) error {
	orm, err := orm.NewORM(config.DatabaseURL(), config.DatabaseTimeout(), gracefulpanic.NewSignal())
	if err != nil {
		return fmt.Errorf("failed to initialize orm: %v", err)
	}
	orm.SetLogging(config.LogSQLStatements() || config.LogSQLMigrations())
	err = orm.RawDB(func(db *gorm.DB) error {
		return migrations.Migrate(db)
	})
	if err != nil {
		return fmt.Errorf("migrateTestDB failed: %v", err)
	}
	orm.SetLogging(config.LogSQLStatements())
	return orm.Close()
}
