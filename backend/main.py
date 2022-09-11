from dotenv import load_dotenv
import table_control as tc
import chart_control as cc
import requests
import database
import scraper
import redis
import time
import os

load_dotenv()
dc = database.get_conn()
rc = redis.Redis(host=os.getenv("HOST"), port=os.getenv("REDIS_PORT"))


def main():
    """
    Updates and publishes table and charts data indefinitely.
    """

    while True:
        try:
            scraped_data = scraper.scrape_garages()
        except requests.exceptions.RequestException as e:
            print(e)
        except scraper.InvalidData as e:
            print(e)
        else:
            datetime_received = scraped_data[0]
            garage_data = scraped_data[1]

            tc.action(datetime_received, garage_data, dc, rc)
            cc.action(datetime_received, garage_data, dc, rc)
        finally:
            time.sleep(5)


if __name__ == "__main__":
    main()
