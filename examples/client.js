'use strict';
//Calculate pi using the Leibniz formula
//Import the index file (usually honeybee-hive)
const honeybeeHive = require('../index.js');
//Import the fs module in order to import the key
const fs = require('fs');
//Define letious settings
const PORT = 54321;
const ADDRESS = 'localhost';

//Import key from filesystem
const key = fs.readFileSync('public.pem', 'utf8');

//Define settings object
const settings = {
  connection: {
    hostname: 'localhost',
    port: 54321
  },
  encryption: {
    key: key
  }
};


//Create the client, connecting to the server with settings object
honeybeeHive.Honeybee(settings, function(eventHandler) {
  //Define variables for the workHandler so that we can resubmit if needed
  let piSection = 0;
  //Define variable for how many times we've retried on an error
  let errorRetries = 0;
  //Define our submission handler, to handle what happens once we submit work
  const submitHandler = function(error, success) {
    //If we error'd, try to resubmit
    if(error) {
      //Log the error
      console.log(error.toString());
      //Resubmit if existing retries is less than 4
      if(errorRetries++ < 4) {
        //Resubmit
        eventHandler.submit(piSection, submitHandler);
      }
      //Return and stop
      return;
    }
    //Reset errorRetries
    errorRetries = 0;
    //Tell the client the status of our submission
    console.log('Submission ' + (success ? 'succeeded' : 'failed'));
    //Request more work, and pass it to the work handler
    eventHandler.request(workHandler);
  };
  //Define our work handler, to handle what happens when we receive work
  const workHandler = function(error, work) {
    if(error) {
      //Log the error
      console.log(error.toString());
      //Retry if errorRetries is less than 5
      if(errorRetries < 5) {
        errorRetries++;
        //Resubmit
        eventHandler.request(workHandler);
        //Return and stop
        return;
      }
    }
    //Reset errorRetries
    errorRetries = 0;
    //Define our piSection letiable, to store the part of pi we calculated
    piSection = 0;
    //Define n for Leibniz's formula, and calculate current position in it
    let n = 1 + (4*10000*work.counter);
    //Loop from 0 (incl) to 1000000000 (excl)
    for(let i=0; i < 10000; i++) {
      //Do the current pair of the series
      piSection += (4/n)-(4/(n+2));
      //Add 4 to n
      n += 4;
    }
    //Log the piSection we just calculated to the console
    console.log('Calculated PiSection: ' + piSection);
    //Submit the work and callback to the submitHandler
    eventHandler.submit(piSection, submitHandler);
  };
  //Callback once we know the client is registered and ready
  eventHandler.once('registered', function() {
    //Request our first piece of work
    eventHandler.request(workHandler);
  });
});
