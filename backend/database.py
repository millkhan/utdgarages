from datetime import datetime
import sqlite3
import json
import os


def get_conn():
    """
    Get a database connection.

    :returns: a database connection
    """

    initialize_database()
    return sqlite3.connect("garage.db")


def initialize_database():
    """
    Create and setup the database if not already created.
    """

    if (not os.path.exists("garage.db")):
        conn = sqlite3.connect("garage.db")

        conn.execute("""CREATE TABLE if not exists live_table (
                    id     integer PRIMARY KEY,
                    data   json,
                    time   datetime
                    )""")
        conn.execute("""CREATE TABLE if not exists weekly_charts (
                    start_day date PRIMARY KEY,
                    data      json
                    )""")
        conn.commit()

        conn.execute("INSERT INTO live_table VALUES (?, ?, ?)", (
            0, None, datetime.now()))
        conn.commit()


def update_live_table(conn, data, time):
    """
    Update data in live_table.

    :param data: data containing the new live table
    :param time: time the live table was recorded
    """

    conn.execute("UPDATE live_table SET data=?, time=? WHERE id=0", (
        json.dumps(data), time))
    conn.commit()


def get_weekly_charts(conn, start_day):
    """
    Get the weekly charts corresponding to a given week start day.

    :param start_day: the key to be used for getting the weekly charts
    :returns: weekly charts or None if a weekly charts doesnt exist with the
    given start day
    """

    data = conn.execute("SELECT data FROM weekly_charts WHERE start_day=?", (
        start_day,)).fetchone()

    if data is None:
        return None
    return data[0]


def insert_new_weekly_charts(conn, start_day, data):
    """
    Insert new weekly charts data into the weekly_charts table.

    :param start_day: the key to be used for getting the weekly charts
    :param data: data containing the new weekly charts
    """

    conn.execute("INSERT INTO weekly_charts VALUES (?, ?)", (
        start_day, json.dumps(data)))
    conn.commit()


def update_weekly_charts(conn, start_day, data):
    """
    Update weekly charts data for a specific weekly charts.

    :param start_day: the key to be used for getting the weekly charts
    :param data: data containing the updated weekly charts
    """

    conn.execute("UPDATE weekly_charts SET data=? WHERE start_day=?", (
        json.dumps(data), start_day))
    conn.commit()
