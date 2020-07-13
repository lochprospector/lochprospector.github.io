import urllib.request as url
from bs4 import BeautifulSoup
import pandas as pd
import os
import re
import csv

metadata = []

datasets_to_download = []
page_no = 1

seed_url = 'https://catalog.data.gov'

files_written = 0

while len(metadata) <= 1000:

    try:
        page = url.urlopen(seed_url + '/dataset?page=' + str(page_no))
        page_no += 1
        soup = BeautifulSoup(page, 'html.parser')
        save_location = os.getcwd() + "/data/"

        for listItem in soup.find_all("li", {"class": "dataset-item"}):
            table = dict()
            title = listItem.h3.a.text.strip() # title
            #print(title)
            table["sr_no"] = files_written
            table["title"] = title
            print(page_no)
            new_soup = BeautifulSoup(url.urlopen(seed_url + listItem.h3.a.get('href')), 'html.parser') # download link
            try:
                download_link = new_soup.find("a", {"data-format": "csv"}) # href=re.compile('.*\.csv$'))
                print(download_link.get('href'))
                save_file = save_location + title + ".csv"
                url.urlretrieve(download_link.get('href'), save_file)
                data = pd.read_csv(save_file)
                row_count = len(data) # number of rows
                column_count = len(data.columns) #number of columns
                table["no_of_rows"] = row_count
                table["no_of_columns"] = column_count

                column_types = []
                str_column_count = 0
                num_column_count = 0
                for col in data.dtypes:
                    if col=='float64' or col=='int64':
                        column_types.append('N') # data type of each column
                        num_column_count += 1
                    else:
                        column_types.append('S') # data type of each column
                        str_column_count += 1
                table["no_of_numerical_columns"] = num_column_count
                table["no_of_string_columns"] = str_column_count
                table["column_types"] = column_types

                unique_values = []
                null_values = []
                for col in data:
                    unique_values.append(len(data[col].unique())) # number of unique values in each column
                for val in data.isna().sum():
                    null_values.append(val)

                str_unique_values = 0
                numeric_unique_values = 0
                str_null_values = 0
                numeric_null_values = 0
                for column_index in range(column_count):
                    if column_types[column_index] == 'S':
                        str_unique_values += unique_values[column_index]
                        str_null_values += null_values[column_index]
                    else:
                        numeric_unique_values += unique_values[column_index]
                        numeric_null_values += null_values[column_index]

                total_value_count = row_count* column_count
                numeric_value_count = row_count * num_column_count
                str_value_count = row_count * str_column_count
                percent_null_total = sum(null_values)/total_value_count * 100
                percent_unique_total = sum(unique_values)/total_value_count * 100
                percent_null_str = str_null_values/str_value_count * 100 if str_value_count != 0 else 0
                percent_unique_str = str_unique_values/str_value_count * 100 if str_value_count != 0 else 0
                percent_null_numeric = numeric_null_values/numeric_value_count * 100 if numeric_value_count != 0 else 0
                percent_unique_numeric = numeric_unique_values/numeric_value_count * 100 if numeric_value_count != 0 else 0
                table["percent_unique_values_total"] = percent_unique_total
                table["percent_unique_values_numeric"] = percent_unique_numeric
                table["percent_unique_values_string"] = percent_unique_str
                table["percent_null_values_total"] = percent_null_total
                table["percent_null_values_numeric"] = percent_null_numeric
                table["percent_null_values_string"] = percent_null_str
                table["unique_values"] = unique_values
                table["null_values"] = null_values # number of null values in each column
                table["column_headers"] = data.columns.values
                table["modified_date"] = ' '.join(new_soup.find('span', {"itemprop": "dateModified"}).text.split(' ')) # date modified
                formats_available = []

                for formats in listItem.find_all('ul', {"class": "dataset-resources"}): # all available formats
                    for form in formats.find_all("a"):
                        formats_available.append(form.text)
                table["available_formats"] = formats_available
                metadata.append(table)
                print(len(metadata))
                with open(save_location+'final_metadata.csv', 'a', newline='') as csvfile:
                    writer = csv.DictWriter(csvfile, fieldnames=table.keys())
                    writer.writerow(table)
                    files_written += 1
            except Exception as e: print('skipped')
    except Exception as e:
        print('some error with url')
        print(e)
    # add total number of unique, null,  columns that have string and numeric values
# loading data into a dataframe and saving
df = pd.DataFrame(metadata)
print(df['column_headers'])
df.to_csv(save_location+"final_metadata_copy.csv")
