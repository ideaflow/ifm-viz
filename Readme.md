# What is this Project?

Ifm-viz is a temporary Idea Flow Map visualizer, intended to be replaced by the ifm-visualizer project.  The main purpose of this project is to port the old IFM visualization code to the new APIs so the JS code can be more easily ported into an entirely different context.

This project includes a SpringBoot app with thymeleaf that displays the IFM timelines using static JS and hard-coded REST endpoints.  

## Starting up the Server

To start up the server:

```
./gradlew bootRun
```
Then browse to:

http://localhost:8980/visualizer/

## Dependencies

This service is dependent on ifm-publisher service for the endpoints:

http://localhost:8080/task
http://localhost:8080/timeline

First, startup ifm-publisher service by following the instructions
in the openmastery/ifm-publisher project readme.

## Intellij Project Setup

To setup the project for development in Intellij:

```
./gradlew clean check

./gradlew idea
```
Import project or module into IDEA and get to coding.
