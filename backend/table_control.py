import database
import cache
import json


def action(current_datetime, data, dc, rc):
    """
    Controls the updating and publishing of all table related data.

    :param current_datatime: current date and time
    :param data: parsed garages data
    :param dc: database connection
    :param rc: redis connection
    """
    formatted_time = current_datetime.strftime("%-I:%M:%S %p").lower()

    database.update_live_table(dc, data, formatted_time)
    cache.publish_update_tables(rc, json.dumps({
        "live_table": data,
        "table_time": formatted_time,
    }))
