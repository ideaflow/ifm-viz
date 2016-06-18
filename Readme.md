
This project includes a SpringBoot app with thymeleaf that displays
the IFM timelines using the API.  This service is dependent on ifm-publisher service
for the endpoints:

http://localhost:8080/task
http://localhost:8080/timeline

First, startup ifm-publisher service by following the instructions
in the project readme.

Then startup the visualizer with:


```
git clone git@github.com:openmastery/ifm-viz.git
cd ifm-viz

./gradlew bootRun
```


To setup the project for development in Intellij:

```
./gradlew clean check

./gradlew idea
```

Import project or module into IDEA and get to coding.
