---
title: "Luigi: An open source ETL tool..."
slug: luigi-an-open-source-etl-tool
cover: "https://unsplash.it/400/300/?random?AngelsofMist"
category: "test3"
categories:
  - Data
  - Code
date: "01/03/2018"
thumbnail: '../thumbnails/luigi.png'
tags:
    - OSE
    - other
time: "10 min"
---

## The "Problem"
When developing a production ready data pipeline, there are a number of aspects to consider aside from simply developing functional code. For example, a strong workflow may include dependency management, checkpoints, parameterization, visualization, and failure recovery. Suddenly, the traditional python data (shown below) pipeline becomes much more complex:

```python
if __name__ == ‘__main__’:
    Extract_data()
    Transform_data()
    Load_data()
```

So how do we manage these considerations in an implementation that still maintains the integrity of the data processing being performed?

## Enter Luigi
Luigi is a nifty workflow management system in the form of a Python package that is relatively simple to use. It was developed at Spotify to address the pains of developing around complex batch jobs and open-sourced in late 2012. To fully understand how Luigi can be applied to your own data pipeline, it is important to understand the fundamental building blocks of Luigi: Tasks and Targets.

Simply put, the Target class maps to an output of many different types. An output could be nearly anything such as a file on a remote file system (`luigi.contrib.ssh.RemoteTarget`), a file on a disk (`luigi.LocalTarget`), or a file on HDFS (`luigi.HdfsTarget`).

A task, on the other hand, is a method designed by extending the class `luigi.Task`. The output of a task is a target. This infrastructure of tasks and targets creates a key feature of the Luigi workflow: atomicity. Because a task requires a successful target to have complete status, we can ensure tasks have been run to completion in time for subsequent tasks while simultaneously pinpointing errors in the flow. To get an idea of what we’re talking about, take a look at the example task provided using our old friends ‘foo’ and ‘bar’ here.

## The Example 
Here’s a brief pipeline that mirrors some of the imports we do on a daily basis in my work developing healthcare software. In this scenario, raw provider data from a hospital was given as a dropped excel file on a corporate shared drive. The information was to be cleaned, formatted, and uploaded into an application’s MySQL database in order to be visible within the app. For the most part, the pipeline presented here is synonymous with the one pushed into production; however, protected information has been removed, as well as some complexity simplified for ease of presentation. One thing to note – if you’ve started to peek at the codebase and are confused by the filepaths, the code reviewed here was deployed in an Alpine Linux docker image.

For our example, the dataset and codebase can be found here. A quick peek at the spreadsheet would reveal that for this exercise we are actually loading Disney characters in the form of healthcare providers! We can see that the dataset has headers *NP*, *NpFirstName*, *NpLastName*, *NPI*, and *Type*. (note: NPI is the unique 10 digit identification number required to recognize healthcare providers in the US).  Our deliverable is correctly formatted data in our application’s MySQL server (see here with output column names). And, with anything new, I feel the best way to learn is by jumping right into it…

## The Implementation
The first part of 99% of data pipelines is the **E** in ETL: extract. In order to do that, we’re going to take advantage of one of my favorite python libraries, pandas, and make a simple python function that will later be fed into a Luigi.task object:

```python
def stage_data(filename):
    """ Load data into stage table (pandas dataframe)
 
    :param filename: The name of file to import in shared drive
    :return: headers, df
    """
    xls_file = pd.ExcelFile(filename)
    df = xls_file.parse('Sheet1')
    return list(df), df
```

The next step in the pipeline is the **T** or transform. Here the transformation is relatively straightforward and is an exercise of mapping input columns to our output columns; however, during this step we must also prune the data for any invalid or bad entries. In the context of this example, bad data is classified as a row of raw data in which there exists a duplicate NPI (provider already loaded into application) or the provider’s full name was null. A quick peek at the raw data reveals that we have both a duplicate NPI entry in two rows (see Minnie Mouse) and a provider with an empty full name (see Buzz Lightyear). Therefore, our flow should include tasks for cleaning and logging these changes to the data.

To do this, let’s create a task that will kick off our workflow, called CreateLogFiles. Looking at the repository reveals that the class follows the task structure of **Requires**, **Output**, and **Run** . Specifically, this tasks has no requirements, and during runtime produces three log files prefixed with the filename that is being imported and the current date. Upon completion, the task looks for the last of the three log files created to inform the central scheduler that its execution is complete.

Next, we create the tasks to actually transform and log the transformations of the data. Specifically, these tasks are the `LogErrors` and `LogDuplicates` tasks. These two tasks are very similar, differing only in what they are logging. The logic to do so is pure python, and relatively straightforward to follow. In the `LogErrors` task, the row for Buzz Lightyear will be identified whereas in the LogDuplicates tasks the row for Minnie Mouse will be identified. Once logged, these rows are removed from the target containing clean data that will be passed to subsequent tasks. Both tasks return `luigi.LocalTarget('/root/etc/mnt/Import/' + os.path.splitext(self.filename)[0] + '_' + timestr + '_Filtered.xlsx')`. The key here is atomicity. By using targets stamped with the current date and suffixed with an identifying tag, we simultaneously maintain logs and cleaned versions of our new data to pass to downstream jobs.

With our cleaned data we’re finally ready populate the database. We first write a couple functions to connect to our MySQL server using PyMySQL and load the data into desired tables:

```python
def get_connection(hostname, username, password):
    """ Get MySQL CNX
 
    :param hostname: Name of NAS drive to connect to
    :return: pymysql.connection
    """
    # connect to db
    connection = ''
    try:
        connection = pymysql.connect(host=hostname,
                                     user=username,
                                     password=password,
                                     charset='utf8mb4',
                                     cursorclass=pymysql.cursors.DictCursor)
    except pymysql.OperationalError:
        print("Failure")
 
    if connection:
        print("Success")
 
    return connection
 
 
def load_cpiproviderinfo(filename, dbName, username, password, headers, df):
    """ Load a list of providers into cpiproviderinfo table
 
    :param filename: Name of provider file
    :param dbName: DB name to load to
    :param headers: from stage_data()
    :param df: from stage_data()
    :return: void
    """
    cnx = get_connection(dbName, username, password)
    if 'A' in filename:
        try:
            with cnx.cursor() as cursor:
                sql = "INSERT INTO providerinfo(ENTY_NM, PROV_FST_NM, PROV_LST_NM, PROV_FULL_NM, PROV_NPI) " \
                      + " values (%s, %s, %s, %s, %s)"
                for index, row in df.iterrows():
                    cursor.execute(sql, (row['Type'], row['NpFirstName'], row['NpLastName'], row['NP'], row['NPI']))
                    cnx.commit()
        finally:
            cnx.close()
    if 'B' in filename:
        try:
            with cnx.cursor() as cursor:
                sql = "INSERT INTO providerinfo(ENTY_NM, PROV_FST_NM, PROV_LST_NM, PROV_FULL_NM, PROV_NPI) " \
                      + " values (%s, %s, %s, %s, %s)"
                for index, row in df.iterrows():
                    cursor.execute(sql, (
                    row['CDO'], row['Provider First Name'], row['Provider Last Name'], row['Provider Name'],
                    row['NPI']))
                    cnx.commit()
        finally:
            cnx.close()
```

With the above functions written, the exercise of writing Luigi tasks becomes trivial. Here it is logical to have two tasks: `ConnectDB` and `LoadProviders`. The output of each task follows the convention used above except the targets are suffixed with an ‘_SUCCESS’ flag.

## Running the Pipeline
Finally we are ready to run our simple example! The total workflow consists of 5 tasks in a single dependency chain. A common pattern among luigi workflows is to have a dummy task at the end of dependency chains to trigger multiple pipelines… Although this is not necessary for our simple example, I’ve created the following task to illustrate the concept:

```python
class ImportFlow(luigi.WrapperTask):
    filename = luigi.Parameter()
    dbName = luigi.Parameter()
    username = luigi.Parameter()
    password = luigi.Parameter()
 
    def run(self):
        print("Running Import for {}".format(self.filename))
 
    def requires(self):
        yield CreateLogFiles(self.filename)
        yield LogErrors(self.filename)
        yield LogDuplicates(self.filename)
        yield LoadProviders(self.filename, self.dbName, self.username, self.password)
        return
```

To run this locally, we navigate to simply call our wrapper task using the syntax outlined in Luigi’s docs and pass in our parameters. The final flag tells Luigi not to connect to a scheduled server:

`luigi --module provider_import ImportFlow --filename test_provider_import_A.xlsx --dbName MyDB --username usr --password pwd --local-scheduler`

When things get put into production, Spotify recommends running the central scheduling server that Luigi provides. The scheduler ensures that the same task is not run by multiple processes at the same time and provides a nice visualization of your workflow. The Luigi scheduler daemon can be started in the foreground with luigid or the background with luigid --background. To run using the scheduling server, we can simply start the daemon and remove the final flag from the above call to get this output:

And Voilà! We can see that all of our tasks have run in the expected order and completed successfully 🙂 !

## Summary
We’ve used a simple example to describe data pipelines using Luigi, an open-source workflow manager in Python. Luigi allows users to abstract data pipelines in terms of tasks and targets and conveniently handles dependencies automatically. Using a workflow manager like Luigi is generally helpful because it manages dependencies, reduces the amount of code required for parameters and error checking, manages failure recovery, and forces clear patterns when developing data pipelines.





