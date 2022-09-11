from bs4 import BeautifulSoup
from datetime import datetime
import requests

GARAGES_URL = "https://services.utdallas.edu/transit/garages/_code.php"


def scrape_garages():
    """
    Scrape and parse the UTD available spaces data into a list.

    :returns: list containaining available spaces data for each garage
    :raises requests.exceptions.RequestException: if connection request fails
    :raises InvalidData: if received data does not match expected format
    """

    try:
        garage_request_data = get_garage_tables()
    except requests.exceptions.RequestException:
        raise
    else:
        garage_tables = garage_request_data[0]
        table_time = garage_request_data[1]

        parsed_garage_data = {}
        for garage_table in garage_tables:
            garage_name = garage_table.find("caption").text
            garage_table_rows = garage_table.find("tbody").find_all(
                "td", class_="rightalign")

            parsed_garage_data[garage_name] = parse_garage_table(
                garage_table_rows)

        data_invalidity_exception = data_validity_check(parsed_garage_data)
        if data_invalidity_exception is not None:
            raise data_invalidity_exception
        return (table_time, parsed_garage_data)


def get_garage_tables():
    """
    Scrape the garage tables html from GARAGES_URL.

    :returns: tuple containing a BeautifoulSoup-ified object of the garage
    tables html and the time the information was received
    :raises requests.exceptions.Timeout: if GARAGES_URL does not respond
    within timeout - connection_attempts times
    :raises requests.exceptions.RequestException: if connection request fails
    """

    connection_attempts = 2

    while True:
        try:
            raw_html = requests.get(GARAGES_URL, timeout=10).text
        except requests.exceptions.Timeout:
            connection_attempts -= 1
            if (connection_attempts == 0):
                raise
        except requests.exceptions.RequestException:
            raise
        else:
            return (BeautifulSoup(raw_html, "lxml").find_all(
                    "table", class_="parking"),
                    datetime.now().replace(microsecond=0))


def parse_garage_table(garage_table_rows):
    """
    Parse spaces data for a given garage.

    :param garage_table_rows: list containing the table data cells from a
    given garage.
    :returns: list containing the available spaces data from a given garage.
    """

    garage_dataset = []

    for space in garage_table_rows:
        garage_dataset.append(int(space.text))
    return garage_dataset


def data_validity_check(parsed_garage_data):
    """
    Check the data validity of the parsed garage data.

    :param parsed_garage_data: list containing all the parsed spaces data for
    all the garages
    :returns: None if the data is valid or an InvalidData exception if the
    data is invalid
    """

    for garage_name in ["PS1", "PS3", "PS4"]:
        if garage_name in parsed_garage_data:
            dataset_length = len(parsed_garage_data[garage_name])
            if dataset_length != 7:
                return InvalidData(
                    "Invalid data: {} dataset contains {} indexes and not 7"
                    .format(garage_name, dataset_length))
        else:
            return InvalidData(
                "Invalid data: data missing garage {}.".format(garage_name))
    return None


class InvalidData(Exception):
    pass
