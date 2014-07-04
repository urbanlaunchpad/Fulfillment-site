google.load('visualization', '1', {packages: ['corechart']});
var mainDatabaseFusionTableID = "1WgAjYadEjbBf_PJbFh6_GPMdL9jum6pIKs1WSAZ-"; // Table with product tracking info.
var actorDatabaseFusionTableID = "1bF6v7cvVekql3mCBAoi6Imo9Ef1kytyYiPUz_J69";
var garmentColumnNames = ["GARMENT_NAME", "GARMENT_CODE", "STEP_NUM", "STEP_DESC", "ACTOR", "HASHTAG", "LOCATION", "LOCATION_GPS", "HANDS", "START_DATE", "COMPLETE_DATE", "DURATION_DAYS", "COST_USD", "IMAGE"];
var actorColumnNames = ["LOCATION", "STORY", "BACKGROUND_IMAGES"];
var stepsToShow;
var infoToShowKeys;
var whatToGet;
var stepsArray;
var actorInfo;

function initialize(){
    textileCodes = getTextileParsingCodes();
}

function getTextileParsingCodes(){
    var textileCodes = ["kot","mir","dha"]
    return textileCodes;
}

function getWhatToGet(columnNames){
    var whatToGet = "";
    for (var i = 0; i < columnNames.length; i++){
        whatToGet = whatToGet + columnNames[i] + ", ";
    }
    whatToGet = whatToGet.substring(0, whatToGet.length - 2);
    return whatToGet;
}

function getGarmentInfo(key, whatToGet){
    var ShirtInfoPromise = new Promise(function(resolve, reject) {
        // do a thing, possibly async, then…
        var queryString = "SELECT " + whatToGet + " FROM " + mainDatabaseFusionTableID + " WHERE GARMENT_CODE = '" + key.garment_Code + "'";
        var query = new google.visualization.Query('http://www.google.com/fusiontables/gvizdata?tq=' + encodeURIComponent(queryString));   
        query.send(function (response){
            var table = response.getDataTable();
            var rows = table.getNumberOfRows();
            // Creating an array with all the steps storead as objects with the information in them storead with the column names as field names.
            stepsArray = new Array(rows);
            for (var j=0; j < rows; j++){
                stepsArray[j] = {};
                for (var i=0; i < garmentColumnNames.length; i++){
                    stepsArray[j][garmentColumnNames[i]] = table.getValue(j,i);
                }
            }
            if (stepsArray.length > 0) {
                resolve("Garment info ready");
            }
            else {
                reject(Error("No garment info"));
            }
        });
    });
    return ShirtInfoPromise;
}

function fillCards(stepsArray, actorInfo){
    var swiperWrapper = document.getElementById("swiper-wrapper");
    for (var i=0; i < stepsArray.length; i++){
        for (var j=0; j < actorInfo[stepsArray[i].ACTOR].length; j++){
            var swiperSlide = document.createElement('div');
            swiperSlide.className = 'swiper-slide';

            var cardTitle = document.createElement('h1');
            cardTitle.className = "card_title";
            var title = document.createTextNode(stepsArray[i].STEP_DESC);
            cardTitle.appendChild(title);
            swiperSlide.appendChild(cardTitle);

            var locationDiv = document.createElement('h2');
            locationDiv.className = "card_location";
            var location = document.createTextNode(actorInfo[stepsArray[i].ACTOR][j].LOCATION);
            locationDiv.appendChild(location);
            swiperSlide.appendChild(locationDiv);

            var storyDiv = document.createElement('p');
            storyDiv.className = "story_paragraph";
            var story = document.createTextNode(actorInfo[stepsArray[i].ACTOR][j].STORY); 
            storyDiv.appendChild(story);
            swiperSlide.appendChild(storyDiv);

            //alert(actorInfo[stepsArray[i].ACTOR][0].IMAGE);
            numberOfImages = actorInfo[stepsArray[i].ACTOR][j].BACKGROUND_IMAGES.length;
            imageIndex = Math.floor(Math.random() * numberOfImages);
            swiperSlide.style.backgroundImage = "url(" + actorInfo[stepsArray[i].ACTOR][j].BACKGROUND_IMAGES[imageIndex] + ")";
            swiperWrapper.appendChild(swiperSlide); 
        }

    }
    createSwiperInterface();
}

// TODO Add parsing function for the key.
function parseKey(key){
    var isKeyOK = true;
    return isKeyOK;
}
function getKeyFromForm(){
    var productionKey = document.getElementById("production").value.toUpperCase();
    var fulfillmentKey = document.getElementById("fulfillment").value.toUpperCase();
    var key = {
        garment_Code : productionKey,
        textile : productionKey.substring(0,3),
        style : productionKey.substring(3,6),
        design_Batch : productionKey.substring(6,9),
        size : fulfillmentKey.substring(0,0),
        unique_ID : fulfillmentKey.substring(1,4),
    };
    return key;
}

function onShowButtonClick(){
    document.getElementById("inputContainer").style.display="none";
    var key = getKeyFromForm();
    if (parseKey(key)) {
        var shirtInfoPromise = getGarmentInfo(key, getWhatToGet(garmentColumnNames));
        shirtInfoPromise.then(function(result) {
            console.log(result); // "Stuff worked!"
            var actorsInfoPromise = getActorsInfoPromise();
            actorsInfoPromise.then(function(result) {
                console.log(result); // "Stuff worked!"
                fillCards(stepsArray, actorInfo);
            }, function(err) {
                console.log(err); // Error: "It broke"
                showError("ACTORS_INFO_ERROR")
            });
        }, function(err) {
            console.log(err); // Error: "It broke"
            showError("SHIRT_INFO_ERROR")
        });
    }
    document.getElementById("cardContainer").style.display="block";
}

function getActorsInfoPromise(){
    var actorsInfoPromise = new Promise(function(resolve, reject) {
        actorInfo = null;
        actorInfo = {};
        var promisesArray = new Array(stepsArray.length);
        var check = 0;
        for (var i=0; i < stepsArray.length; i++){
            promisesArray[i] = getActorPromise(i, getWhatToGet(actorColumnNames));
            promisesArray[i].then(function(result) {
                    console.log(result); // "Stuff worked!"
                    check++;
                    if (check == stepsArray.length) {
                        resolve("Got all the actors info");
                    }
                }, function(err) {
                    console.log(err); // Error: "It broke"
                    //showError("ACTOR_INFO_ERROR")
                    check++;
                    if (check == stepsArray.length) {
                        resolve("Got all the actors info");
                    }
                });
        }
    });
    return actorsInfoPromise;
}

function getActorPromise(index, whatToGet){
    var actorPromise = new Promise(function(resolve, reject) {
        // do a thing, possibly async, then…
        var queryString = "SELECT " + whatToGet + " FROM " + actorDatabaseFusionTableID + " WHERE ACTOR = '" + stepsArray[index].ACTOR + "'";
        var query = new google.visualization.Query('http://www.google.com/fusiontables/gvizdata?tq=' + encodeURIComponent(queryString));   
        query.send(function (response){     
            var table = response.getDataTable();
            var rows = table.getNumberOfRows();
            // Creating an array with all the actors storead as objects with the information in them storead with the column names as field names.
            var infoArray = new Array(rows);
            for (var j=0; j < rows; j++){
                infoArray[j] = {};
                for (var i=0; i < actorColumnNames.length; i++){
                    var value = table.getValue(j,i);
                    if(actorColumnNames[i] == "BACKGROUND_IMAGES"){
                        var imageArray = parseImages(value);
                        infoArray[j][actorColumnNames[i]] = imageArray;
                    } else {
                        infoArray[j][actorColumnNames[i]] = value;  
                    } 
                }
            }
            actorInfo[stepsArray[index].ACTOR] = infoArray; 
            //alert(actorInfo[stepsArray[index].ACTOR][0].STORY);
            if (infoArray.length > 0) {
                resolve("Info from actor ready");
            }
            else {
                reject(Error("No info from actor " + index));
            }
        });
    });
    return actorPromise;
}

function parseImages(imageString){
    imageArray = imageString.split(",");
    //alert("image array lenght" + imageArray.length);
    return imageArray
}

function showError(error){
    alert(error)
}

function createSwiperInterface() {
    var mySwiper = new Swiper('.swiper-container',{
        //Your options here:
        mode:'horizontal',
        pagination: '.pagination',
        paginationClickable: true,
        loop: true,
        grabCursor: true,
        createPagination: true,
        autoResize: true,
        resizeReInit: true,
        //etc..
    });
}