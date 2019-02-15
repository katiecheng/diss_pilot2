
/*
TODO
Once I'm done testing
- collect start/end times for duration
- collect individual word accuracy data during study and test
- update conditions!
- add 5 little dots that countdown so people know it's working?
- progress bar for each round of 20 words
- giving credit for plural
- change the trial order to be experiment specific?
- decide trial duration (study vs. strategy vs. test)
*/

// ## Helper functions

// Shows slides. We're using jQuery here - the **$** is the jQuery selector function, which takes as input either a DOM element or a CSS selector string.
function showSlide(id) {
  // Hide all slides
    $(".slide").hide();
    // Show just the slide we want to show
    $("#"+id).show();
}

// Get a random integer less than n.
function randomInteger(n) {
  return Math.floor(Math.random()*n);
}

// Fisher-Yates (aka Knuth) Shuffle (https://github.com/coolaj86/knuth-shuffle)
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex > 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex --;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


// ## Configuration settings
var numTrials = 40,
  trialDuration = 5000,
  feedbackDuration = 2000, 
  //toggle test 1 or 2 strategy rounds
  numStrategyRounds = 2;
  // condition = randomInteger(4), // 2x2
  // condition = randomInteger(2), // expt vs. control
  condition = 2,
  /* test intervention with first numTrials items, in case need to re-test people*/
  // numTrials = 20, // testing
  // myTrialOrder = shuffle([...Array(numTrials).keys()]),
  // interventionTrials = myTrialOrder.slice(0),
  // assessmentTrials = [],
  /* test intervention with last numTrials items */
  myTrialOrder = shuffle([...Array(40).keys()].slice(20,40)),
  interventionTrials = myTrialOrder.slice(0),
  assessmentTrials = [],
  /* full intervention with all 40 */
  // interventionTrials = myTrialOrder.slice(0,(numTrials/2)),
  // assessmentTrials = myTrialOrder.slice((numTrials/2), numTrials),
  swahili_english_pairs = [
    ["adhama", "honor"],
    ["adui", "enemy"],
    ["bustani", "garden"],
    ["buu", "maggot"],
    ["chakula", "food"],
    ["dafina", "treasure"],
    ["elimu", "science"],
    ["embe", "mango"],
    ["fagio", "broom"],
    ["farasi", "horse"],
    ["fununu", "rumour"],
    ["godoro", "mattress"],
    ["goti", "knee"],
    ["hariri", "silk"],
    ["kaa", "crab"],
    ["kaburi", "grave"],
    ["kaputula", "shorts"],
    ["leso", "scarf"],
    ["maiti", "corpse"],
    ["malkia", "queen"],
    ["mashua", "boat"],
    ["ndoo", "bucket"],
    ["nyanya", "tomato"],
    ["pazia", "curtain"],
    ["pipa", "barrel"],
    ["pombe", "beer"],
    ["punda", "donkey"],
    ["rembo", "ornament"],
    ["roho", "soul"],
    ["sala", "prayer"],
    ["sumu", "poison"],
    ["tabibu", "doctor"],
    ["theluji", "snow"],
    ["tumbili", "monkey"],
    ["usingizi", "sleep"],
    ["vuke", "steam"],
    ["yai", "egg"],
    ["zeituni", "olives"],
    ["ziwa", "lake"],
    ["zulia", "carpet"]
  ];

// Show the instructions slide -- this is what we want subjects to see first.
showSlide("instructions");

// ## The main event
/* I implement the sequence as an object with properties and methods. The benefit of encapsulating everything in an object is that it's conceptually coherent (i.e. the <code>data</code> variable belongs to this particular sequence and not any other) and allows you to **compose** sequences to build more complicated experiments. For instance, if you wanted an experiment with, say, a survey, a reaction time test, and a memory test presented in a number of different orders, you could easily do so by creating three separate sequences and dynamically setting the <code>end()</code> function for each sequence so that it points to the next. **More practically, you should stick everything in an object and submit that whole object so that you don't lose data (e.g. randomization parameters, what condition the subject is in, etc). Don't worry about the fact that some of the object properties are functions -- mmturkey (the Turk submission library) will strip these out.*/
var experiment = {
  // Properties
  numTrials: numTrials,
  numStrategyRounds: numStrategyRounds,
  condition: condition,
  myTrialOrder: myTrialOrder, // already shuffled
  trialDuration: trialDuration,
  feedbackDuration: feedbackDuration,
  // interventionTrials is the first half of myTrialOrder
  interventionStudyTrials: shuffle(interventionTrials.slice(0)), // study order
  interventionStrategyTrials1: shuffle(interventionTrials.slice(0)), // strategy order 1
  interventionStrategyTrials2: shuffle(interventionTrials.slice(0)), // strategy order 2
  interventionGenerateTrials: interventionTrials.slice(0,(interventionTrials.length/2)),
  interventionRestudyTrials: interventionTrials.slice((interventionTrials.length/2), interventionTrials.length),
  interventionGenerateStrategyScore: Array(numStrategyRounds).fill(0),
  interventionRestudyStrategyScore: Array(numStrategyRounds).fill(0),
  interventionTestTrials: shuffle(interventionTrials.slice(0)), // test order
  interventionGenerateTestScore: 0,
  interventionRestudyTestScore: 0,
  //assessmentTrials is the second half of myTrialOrder
  assessmentStudyTrials: shuffle(assessmentTrials.slice(0)),
  assessmentStrategyTrials: shuffle(assessmentTrials.slice(0)),
  assessmentTestTrials: shuffle(assessmentTrials.slice(0)),
  assessmentTestScore: 0,
  
  // An array to store the data that we're collecting.
  data: [],

  //Intro to study
  interventionStudyFraming: function() { 
    var header = "Word Pairs - Round 1";
    var text = "In a moment, you will be presented with 20 Swahili words paired with \
    their English translations. You will see each Swahili-English word pair \
    for 5 seconds, and then the screen will automatically advance to the \
    next pair. Please pay attention, and study the pair so you can type \
    the English translation given the Swahili word.";
    showSlide("textNext");
    $("#instructionsHeader").text(header);
    $("#instructionsText").text(text);
    $("#nextButton").click(function(){$(this).blur(); experiment.interventionStudy();});
    console.log($("#instructionsText").text());
  },

  // 20 items, View each item for 5 sec
  interventionStudy: function() {
    var trials = experiment.interventionStudyTrials;
    if (trials.length == 0) {
      experiment.interventionStrategyFraming(1);
      return;
    }
    var currItem = trials.shift(),    
      swahili = swahili_english_pairs[parseInt(currItem)][0],
      english = swahili_english_pairs[parseInt(currItem)][1];

    showSlide("study");
    $("#wordpair").text(swahili + " : " + english);
    setTimeout(function(){experiment.interventionStudy()}, trialDuration);
  },

  //Intro to strategy
  interventionStrategyFraming: function(round) {
    if (round == 1) {
      var header = "Study - Round 1";
      var text = "Now you will be asked to study each pair either by (1) \
                reviewing the Swahili-English word pair, or (2) trying to \
                recall the English translation from memory. After 5 seconds,\
                the screen will automatically advance and save your input.";
    } else if (round == 2) {
      var header = "Study - Round 2";
      var text = "Now, you will be asked to study each pair again, \
                either by (1) \
                reviewing the Swahili-English word pair, or (2) trying to \
                recall the English translation from memory. After 5 seconds,\
                the screen will automatically advance and save your input.";
    }
    showSlide("textNext");
    $("#instructionsHeader").text(header);
    $("#instructionsText").text(text);
    $("#nextButton").click(function(){$(this).blur(); experiment.interventionStrategy(round);});
    console.log($("#instructionsText").text());
  },

  //Apply strategy to each item for 5 sec 1/2 copy 1/2 generate (randomize)
  interventionStrategy: function(round) {
    console.log("interventionStrategyTrials1: ", experiment.interventionStrategyTrials1);
    console.log("interventionStrategyTrials2: ", experiment.interventionStrategyTrials2);
    if (round == 1) {
      var trials = experiment.interventionStrategyTrials1;
      if (trials.length == 0) {
        if (numStrategyRounds == 1){experiment.interventionPredict();
        } else if (numStrategyRounds == 2) {experiment.interventionStrategyFraming(2);
        } return;
      } 
    } else if (round == 2) {
      var trials = experiment.interventionStrategyTrials2;
      if (trials.length == 0) {experiment.interventionPredict(); return;} 
    }
    var currItem = trials.shift(),
      swahili = swahili_english_pairs[parseInt(currItem)][0],
      english = swahili_english_pairs[parseInt(currItem)][1],
      generateItem = ($.inArray(currItem, experiment.interventionGenerateTrials) != -1),
      restudyItem = ($.inArray(currItem, experiment.interventionRestudyTrials) != -1);

    if (generateItem) {
      showSlide("generate");
      $("#swahili").text(swahili + " : ");
      $("#generatedWord").val('');
      $("#generatedWord").focus();
      setTimeout(function(){
        $("#generatedForm").submit(experiment.captureWord("interventionStrategy", round, currItem, swahili, english));
      }, trialDuration-feedbackDuration); 
    } else if (restudyItem) {
      showSlide("restudy");
      $("#restudyWordpair").text(swahili + " : " + english);
      $("#restudySwahili").text(swahili + " : ");
      $("#restudiedWord").val('');
      $("#restudiedWord").focus();
      setTimeout(function(){
        $("#generatedForm").submit(experiment.captureWord("interventionStrategy", round, currItem, swahili, english));
      }, trialDuration); 
    }
  },

  //show feedback
  interventionGenerateFeedback: function(round, swahili, english, accuracy) {
    $("#feedback").show();
    $("#feedback").text(swahili + " : " + english);
    if (accuracy == 1){
      $("#feedback").css("color", "green");
    } else {
      $("#feedback").css("color", "red");
    }
    setTimeout(function(){
      $("#feedback").hide();
      experiment.interventionStrategy(round);}, feedbackDuration); 
  },

  // Capture and save trial
  captureWord: function(exptPhase, round, currItem, swahili, english) {
    var generatedWord = $("#generatedWord").val().toLowerCase(),
      restudiedWord = $("#restudiedWord").val().toLowerCase(),
      generateItem = ($.inArray(currItem, experiment.interventionGenerateTrials) != -1),
      restudyItem = ($.inArray(currItem, experiment.interventionRestudyTrials) != -1);

    if (generateItem){
      strategy = "generate";
    } else if (restudyItem){
      strategy = "restudy";
    }

    if (exptPhase == "interventionStrategy"){
      if (restudyItem){
        var userInput = restudiedWord;
      } else if (generateItem) {
        var userInput = generatedWord;
      }
    } else {
      var userInput = generatedWord;
    }

    var accuracy = english == userInput ? 1 : 0,
      data = {
        exptPhase: exptPhase,
        strategy: strategy,
        item: currItem,
        swahili: swahili,
        english: english,
        userInput: userInput,
        accuracy: accuracy
      };

    if (exptPhase == "interventionStrategy"){
      if (generateItem){
        experiment.interventionGenerateStrategyScore[round-1] += accuracy;
        experiment.interventionGenerateFeedback(round, swahili, english, accuracy);
      } else if (restudyItem){
        experiment.interventionRestudyStrategyScore[round-1] += accuracy;
        experiment.interventionStrategy(round);
      } 
    } else if (exptPhase == "interventionTest"){
      if (generateItem){
        experiment.interventionGenerateTestScore += accuracy;
      } else if (restudyItem){
        experiment.interventionRestudyTestScore += accuracy;
      } 
      experiment.test(exptPhase);
    } else if (exptPhase == "assessmentTest"){
      experiment.assessmentTestScore += accuracy;
      experiment.test(exptPhase);
    }

    experiment.data.push(data);
    return false; // stop form from being submitted
  },

  /* “For 10 of these Swahili-English word pairs, you used the review strategy--
  you studied by reviewing the Swahili-English word pairs. Out of these 10, how 
  many English translations do you think you’ll remember on the quiz?” ( __ / 10, and OE why?)
  “For 10 of these Swahili-English word pairs, you used the recall strategy--you 
  studied by trying to recall the English translation from memory. Out of these 10, 
  how many English translations do you think you’ll remember on the quiz?” ( __ / 10, and OE why?)
  */

  interventionPredict: function() {
    experiment.interventionTestFraming()
  },

  /*
  “Now, you will be shown each Swahili word again. You’ll have 10 seconds to type the 
  correct English translation.”
  */
  interventionTestFraming: function() {
    var header = "Quiz"
    var text = "Let's see what you learned! Next, you will be shown each Swahili word again.\
     You’ll have 5 seconds to type the correct English translation."
    showSlide("textNext");
    $("#instructionsHeader").text(header);
    $("#instructionsText").text(text);
    $("#nextButton").click(function(){$(this).blur(); experiment.test("interventionTest");});
    console.log($("#instructionsText").text());
  },


  // (All items rote for 10 sec, +/- feedback on each item)
  test: function(exptPhase) {
    if (exptPhase == "interventionTest") {
      var trials = experiment.interventionTestTrials;
      if (trials.length == 0) {experiment.interventionFeedback(); return;} 
    } else if (exptPhase == "assessmentTest") {
      var trials = experiment.assessmentTestTrials;
      if (trials.length == 0) {experiment.end(); return;} 
    }

    // Get the current trial - <code>shift()</code> removes the first element of the array and returns it.
    var currItem = experiment.interventionTestTrials.shift(),
      swahili = swahili_english_pairs[parseInt(currItem)][0],
      english = swahili_english_pairs[parseInt(currItem)][1];

    showSlide("generate");
    $("#swahili").text(swahili + " : ");
    $("#generatedWord").val('');
    $("#generatedWord").focus();

    // Wait 5 seconds before starting the next trial.
    setTimeout(function(){$("#generatedForm").submit(
      experiment.captureWord(exptPhase, 0, currItem, swahili, english));
    }, trialDuration); 
  },

  /*
  No strategy feedback: summative performance outcome
  “You scored a __ / 20!”

  Strategy feedback: Proof of utility
  “You scored a __ / 20!
  When using the recall strategy, you scored __ /10
  When using the review strategy, you scored __ /10
  */
  interventionFeedback: function() {
    var text = `You scored ${experiment.interventionGenerateTestScore + experiment.interventionRestudyTestScore} / 20. 
    On the items that you studied by reviewing the Swahili-English word pair, you scored 
    ${experiment.interventionRestudyTestScore} /10. On the items that you studied by tring to recall the 
    English translation from memory, you scored ${experiment.interventionGenerateTestScore} /10.`
    showSlide("feedbackNext");
    $("#feedbackText").text(text);
    // TOGGLE THIS TO GO TO ASSESSMENT/END
    // $("#feedbackNextButton").click(function(){$(this).blur(); experiment.assessmentFraming()});
    $("#feedbackNextButton").click(function(){$(this).blur(); experiment.end()});
  },

  /* “Now, you will see 20 new Swahili words paired with their English translations. 
  Then, you will have 5 seconds to study each pair using whatever method you would like. 
  Finally, you will be quizzed on all 20 Swahili-English word pairs.”*/
  assessmentStudyFraming: function() {
    experiment.assessmentStudy();
  },

  // 20 items, View each item for 5 sec
  assessmentStudy: function() {
    // If the number of remaining trials is 0, we're done, so call the end function.
    if (experiment.assessmentTrials.length == 0) {
      experiment.assessmentStrategyFraming();
      return;
    }
    
    // Get the current trial - <code>shift()</code> removes the first element of the array and returns it.
    var n = experiment.assessmentTrials.shift();
  },

  /*Then, you will have 5 seconds to study each pair using whatever method you would like. */
  assessmentStrategyFraming: function() {
    experiment.assessmentStrategy();
  },

  /*
  Study each item for 5 sec
  adhama - _______
  [See English definition]
  (measure latency to click)
  */
  assessmentStrategy: function() {
    experiment.assessmentTestFraming();
  },

  /*
  “Now, you will be shown each Swahili word again. You’ll have 10 seconds to type the 
  correct English translation.”
  */
  assessmentTestFraming: function() {
    experiment.test(2);
  },

  // The function that gets called when the sequence is finished.
  end: function() {
    // Show the finish slide.
    showSlide("end");
    // Wait 1.5 seconds and then execute function
    setTimeout(function() { 
      turk.submit(experiment);
      var form = document.createElement(form);
      document.body.appendChild(form);
      // addFormData(form, "data", JSON.stringify(experiment));
      // submit the form
      // form.action = turk.turkSubmitTo + "/mturk/externalSubmit";
      // form.method = "POST";
      // form.submit();

    }, 1500);
  }
}