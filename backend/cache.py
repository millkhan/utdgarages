def publish_update_tables(conn, table_data):
    """
    Publish updated live table data.

    :param conn: redis connection
    :param table_data: table_data to be published
    """

    conn.publish("updateTables", table_data)


def publish_update_day_chart(conn, charts_data):
    """
    Publish updated charts data.

    :param conn: redis connection
    :param chart_data: chart_data to be published
    """

    conn.publish("updateDayChart", charts_data)


def publish_add_day_chart(conn, charts_data):
    """
    Publish updated charts data.

    :param conn: redis connection
    :param charts_data: chart_data to be published
    """

    conn.publish("addDayChart", charts_data)


def publish_reset_week(conn, charts_data):
    """
    Publish new charts data.

    :param conn: data containing the new live table
    :param chart_data: time the live table was recorded
    """

    conn.publish("resetWeek", charts_data)
