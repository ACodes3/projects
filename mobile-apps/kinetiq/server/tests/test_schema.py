import re
import sqlite3
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

def statements(name):
    contents = (ROOT / 'lib/core/database' / name).read_text()
    triples = re.findall(r"'''(.*?)'''", contents, re.S)
    singles = re.findall(r"^\s*'(CREATE INDEX [^']+)'\s*,?", contents, re.M)
    return triples + singles

class SchemaTests(unittest.TestCase):
    def connection(self):
        db = sqlite3.connect(':memory:')
        db.execute('PRAGMA foreign_keys=ON')
        return db

    def test_schema_v1(self):
        with self.connection() as db:
            for sql in statements('schema.dart'):
                db.execute(sql)
            self.assertIsNotNone(db.execute("SELECT 1 FROM sqlite_master WHERE name='session_sets'").fetchone())

    def test_schema_v2_fresh(self):
        with self.connection() as db:
            for sql in statements('schema.dart') + statements('schema_v2.dart'):
                db.execute(sql)
            for table in ['saved_meals','saved_meal_items','nutrition_goals','local_notifications']:
                self.assertIsNotNone(db.execute('SELECT name FROM sqlite_master WHERE name=?', (table,)).fetchone())

    def test_schema_v1_to_v2_preserves_rows(self):
        with self.connection() as db:
            for sql in statements('schema.dart'):
                db.execute(sql)
            db.execute("INSERT INTO exercises(id,name) VALUES('one','Squat')")
            db.execute("INSERT INTO routines(id,title,created_at) VALUES('r','Day A','2026-11-19')")
            db.execute("INSERT INTO sessions(id,name_snapshot,status,started_at) VALUES('s','Day A','in_progress','2026-11-19')")
            db.execute("INSERT INTO session_exercises(id,session_id,name_snapshot,tracking_mode,position) VALUES('se','s','Squat','weight_reps',0)")
            db.execute("INSERT INTO session_sets(id,session_exercise_id,position,weight_kg,reps,completed) VALUES('ss','se',0,60,10,1)")
            for sql in statements('schema_v2.dart'):
                db.execute(sql)
            self.assertEqual(db.execute("SELECT name FROM exercises WHERE id='one'").fetchone()[0], 'Squat')
            self.assertEqual(db.execute("SELECT weight_kg*reps FROM session_sets WHERE id='ss'").fetchone()[0], 600)
            self.assertEqual(db.execute('PRAGMA foreign_key_check').fetchall(), [])

    def test_foreign_keys_are_enforced(self):
        with self.connection() as db:
            for sql in statements('schema.dart')+statements('schema_v2.dart'):
                db.execute(sql)
            with self.assertRaises(sqlite3.IntegrityError):
                db.execute("INSERT INTO session_sets(id,session_exercise_id,position) VALUES('orphan','missing',0)")

    def test_cascade_saved_meal_items(self):
        with self.connection() as db:
            for sql in statements('schema.dart')+statements('schema_v2.dart'):
                db.execute(sql)
            db.execute("INSERT INTO saved_meals VALUES('m','Meal','2026-11-19')")
            db.execute("INSERT INTO saved_meal_items(id,saved_meal_id,name_snapshot,grams) VALUES('i','m','Food',100)")
            db.execute("DELETE FROM saved_meals WHERE id='m'")
            self.assertEqual(db.execute('SELECT COUNT(*) FROM saved_meal_items').fetchone()[0],0)

    def test_snapshot_survives_template_deletion(self):
        with self.connection() as db:
            for sql in statements('schema.dart')+statements('schema_v2.dart'):
                db.execute(sql)
            db.execute("INSERT INTO routines(id,title,created_at) VALUES('r','Day A','2026-11-19')")
            db.execute("INSERT INTO sessions(id,routine_id,name_snapshot,status,started_at) VALUES('s','r','Day A','completed','2026-11-19')")
            db.execute("DELETE FROM routines WHERE id='r'")
            self.assertEqual(db.execute("SELECT name_snapshot FROM sessions WHERE id='s'").fetchone()[0],'Day A')

    def test_nutrients_allow_null(self):
        with self.connection() as db:
            for sql in statements('schema.dart')+statements('schema_v2.dart'):
                db.execute(sql)
            db.execute("INSERT INTO foods(id,name,kcal_100g) VALUES('f','Food',NULL)")
            self.assertIsNone(db.execute("SELECT kcal_100g FROM foods WHERE id='f'").fetchone()[0])

    def test_invalid_session_status_rejected(self):
        with self.connection() as db:
            for sql in statements('schema.dart')+statements('schema_v2.dart'):
                db.execute(sql)
            with self.assertRaises(sqlite3.IntegrityError):
                db.execute("INSERT INTO sessions(id,name_snapshot,status,started_at) VALUES('s','X','fake','2026')")

if __name__ == '__main__':
    unittest.main()
