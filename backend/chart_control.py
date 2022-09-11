from datetime import datetime, timedelta
import database
import cache
import json
import os


def action(current_datetime, data, dc, rc):
    """
    Controls the creating, updating, and publishing of all chart related data.

    :param current_datatime: current date and time
    :param data: parsed garages data
    :param dc: database connection
    :param rc: redis connection
    """

    if not check_timestamp(current_datetime):
        return

    current_date = datetime.date(current_datetime)
    start_week_date = current_date - timedelta(days=current_date.weekday() % 7)

    weekly_charts = database.get_weekly_charts(dc, start_week_date)
    if weekly_charts is None:
        new_weekly_charts = create_new_weekly_charts(current_datetime, data)
        database.insert_new_weekly_charts(
            dc, start_week_date, new_weekly_charts)
        cache.publish_reset_week(rc, json.dumps(new_weekly_charts))
    else:
        updated_weekly_charts, is_new_day = insert_chart_datapoint(
            current_datetime, data, weekly_charts)
        database.update_weekly_charts(
            dc, start_week_date, updated_weekly_charts)
        if is_new_day:
            cache.publish_add_day_chart(rc, json.dumps(
                updated_weekly_charts[-1]))
        else:
            cache.publish_update_day_chart(rc, json.dumps(
                updated_weekly_charts[-1]))
    update_timestamp(current_datetime, 60)


def check_timestamp(current_datetime):
    """
    Checks whether it's time to update the weekly charts.

    :param current_datatime: current date and time
    :returns: True if its time to update the weekly, False if not
    """

    timestamp_repair(current_datetime)

    current_timestamp = current_datetime.replace(second=0)
    next_timestamp = read_timestamp()

    if current_timestamp == next_timestamp:
        return True
    return False


def timestamp_repair(current_datetime):
    """
    Checks and repairs (or creates) the next_timestamp.json file if its time
    has fallen behind the current time.

    :param current_datatime: current date and time
    """

    current_timestamp = current_datetime.replace(second=0)

    if not os.path.exists("next_timestamp.json"):
        if current_timestamp.minute == 0:
            print(current_timestamp)
            update_timestamp(current_timestamp, 0)
        else:
            update_timestamp(current_timestamp, 60)
    else:
        next_timestamp = read_timestamp()

        time_difference = (next_timestamp - current_timestamp).total_seconds()
        if time_difference < 0:
            if current_timestamp.minute == 0:
                update_timestamp(current_timestamp, 0)
            else:
                update_timestamp(current_timestamp, 60)


def read_timestamp():
    """
    Reads and returns the next_timestamp contained within next_timestamp.json

    :returns: datetime object containing the next_timestamp
    """

    with open("next_timestamp.json", "r") as file:
        next_timestamp = datetime.fromisoformat(
            json.load(file)["next_timestamp"])
    return next_timestamp


def update_timestamp(current_datetime, time_skip):
    """
    Updates or creates the next_timestamp with (current_timestamp + time_skip)

    :param current_datetime: current date and time
    :param time_skip: the amount of time to skip for the next timestamp
    """

    next_timestamp = current_datetime.replace(
        minute=0, second=0) + timedelta(minutes=time_skip)

    with open("next_timestamp.json", "w") as file:
        json.dump({"next_timestamp": str(next_timestamp)}, file)


def insert_chart_datapoint(current_datetime, data, weekly_charts):
    """
    Inserts a new datapoint into the weekly charts.
    Additionally, handles correcting the date of a datapoint insertion if
    times fall out of sync.

    :param current_datetime: current date and time
    :param data: parsed garages data
    :param weekly_charts: the current weekly charts
    :returns: tuple containing the updated weekly charts and whether a new day
    was created in the weekly charts
    """

    weekly_charts = json.loads(weekly_charts)
    first_elem_idx = len(weekly_charts) - 1
    weekday_idx = current_datetime.weekday()
    is_new_day = False

    if first_elem_idx == weekday_idx:
        append_to_chart_dataset(current_datetime, data, weekly_charts)
    elif (first_elem_idx + 1) == weekday_idx:
        weekly_charts.append(create_new_day_chart())
        append_to_chart_dataset(current_datetime, data, weekly_charts)
        is_new_day = True
    else:
        day_offset = weekday_idx - (first_elem_idx + 1)
        for _ in range(day_offset):
            weekly_charts.append(None)

        weekly_charts.append(create_new_day_chart())
        append_to_chart_dataset(current_datetime, data, weekly_charts)
        is_new_day = True
    return (weekly_charts, is_new_day)


def create_new_weekly_charts(current_datetime, data):
    """
    Creates a new list containing the new weekly charts data.
    Additionally, handles correcting the chart creation if times fall out of
    sync.

    :param current_datetime: current date and time
    :param data: parsed garages data
    :returns: list containing the new weekly charts
    """

    new_weekly_charts = []
    weekday_idx = current_datetime.weekday()

    for _ in range(weekday_idx):
        new_weekly_charts.append(None)

    new_weekly_charts.append(create_new_day_chart())
    append_to_chart_dataset(current_datetime, data, new_weekly_charts)

    return new_weekly_charts


def create_new_day_chart():
    """
    Creates a new dict containing the shell of where the new daily charts data
    will go.

    :returns: dict containing the new daily charts shell
    """

    new_day_chart = {}
    for garage_name in ["PS1", "PS3", "PS4"]:
        dataset = []
        for _ in range(7):
            dataset.append([])
        new_day_chart[garage_name] = dataset

    return new_day_chart


def append_to_chart_dataset(current_datetime, data, weekly_charts):
    """
    Appends a new chart datapoint into weekly charts for a given daily chart.
    Additionally, handles correcting the weekly charts if times fall out of
    sync.

    :param current_datetime: current date and time
    :param data: parsed garages data
    :param weekly_charts: the current weekly charts
    """

    current_hour = current_datetime.hour
    weekday_idx = current_datetime.weekday()

    for garage_name in data:
        for dataset_idx in range(len(weekly_charts[weekday_idx][garage_name])):
            while len(weekly_charts[weekday_idx]
                                   [garage_name][dataset_idx]) < current_hour:
                weekly_charts[weekday_idx][garage_name][dataset_idx].append(
                    None)
            weekly_charts[weekday_idx][garage_name][dataset_idx].append(
                data[garage_name][dataset_idx])
