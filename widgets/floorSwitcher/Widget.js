//doubleclicking sometimes causes issue
//assumption floor 2 or three characters

define(["dijit/form/Textarea", "dojo/dom-attr", "dijit/registry","dojo/dom-class", "esri/graphicsUtils","dojo/query","dojo/dom-style" , "jimu/PanelManager", "dojo/_base/array", "dijit/form/CheckBox", "dojo/dom-construct", "dojo/dom", "dojo/on", "esri/tasks/query" ,"esri/tasks/QueryTask", 'dojo/_base/declare', 'jimu/BaseWidget', "dojo/NodeList-traverse", "dojo/domReady!"],
  function(Textarea, domAttr, registry, domClass, graphicsUtils,query, domStyle , PanelManager, arrayUtil, CheckBox, domConstruct, dom, on, Query, QueryTask, declare, BaseWidget) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {
      // Custom widget code goes here

      baseClass: 'jimu-widget-mywidget',
      
      buildingsLayerClick: null,
      
      //sorting used for floor list slider
      compareBySecondArrayElement: function(a, b) {if (a[1] === b[1]) {return 0;}else {return (a[1] < b[1]) ? -1 : 1;}},

      //this property is set by the framework when widget is loaded.
      //name: 'CustomWidget',

      //methods to communication with app container:

      // postCreate: function() {
      //   this.inherited(arguments);
      // },

      //startup: function() {
      //,

      onOpen: function(){
         console.log('onOpen');

         //add help text
	     domConstruct.create("p", {innerHTML:"<br>The <i>Each building</i> mode switches floor levels for individual buildings.<br><br>The <i>All buildings</i> mode switches the floor level for all University buldings. <br><br>The <i>SQL</i> mode allows you to set the floors to be displayed via a SQL query."}, "floorList");

      	 map = this.map;

         allLayers = this.map.graphicsLayerIds;
         buildingsLayer = this.map.getLayer(this.map.graphicsLayerIds[this.config.buildingsLayerNumber]); //app parameter
         wallsLayer = this.map.getLayer(this.map.graphicsLayerIds[this.config.wallsLayerNumber]); //app parameter
         roomsLayer = this.map.getLayer(this.map.graphicsLayerIds[this.config.roomsLayerNumber]); //app parameter
         var wallsLayerURL = wallsLayer.url;

         config = this.config

         //customized for telecom 04142016
         config.wallsLayer_origfilter = wallsLayer.getDefinitionExpression()
         config.roomsLayer_origfilter = roomsLayer.getDefinitionExpression()
         wallsLayer.setDefinitionExpression("OBJECTID < 1");
         roomsLayer.setDefinitionExpression("OBJECTID < 1");


         var floorIDFieldname = this.config.floorID
         var floorSortFieldname = this.config.wallsLayerSortField
         var buidlingNameFieldname = this.config.buidlingName
         var buildingIDFieldname = this.config.buildingID
         var wallsLayerBldgIDField = this.config.wallsLayerBldgIDField
         var wallsLayerSortField = this.config.wallsLayerSortField

         var allFloors

         //function used for toggeling selected floor buttons on and off
         function manageButtonSymbol(bldg, buttonID){
           var floorButtons = query('.floorButton', dom.byId(bldg));
         	 floorButtons.forEach(function(b){
         	   domClass.remove(b,"selectedFloorButton");
         		 });
         	  domClass.add(buttonID, "selectedFloorButton");
             };

         //register click function buildFloorSwitcher with the buildingsLayer because toggle by building is the default mode
		     buildingsLayerClick  = buildingsLayer.on("click", buildFloorSwitcher);

		     //this function is called by buildFloorSwitcher. It adds the appropriate html elements to the widget.  
		     function addFloorsToSlider(results){
		 	       clickedBuildingFloors = [];
		 	       for (var i = 0; i < results.features.length; i++) {
		 		       clickedBuildingFloors.push([results.features[i].attributes[floorIDFieldname], results.features[i].attributes[floorSortFieldname]]); 
			         }

   			       clickedBuildingFloors.sort(this.compareBySecondArrayElement)
    		
    		       //create a div that holds building Info and floors etc
    		       domConstruct.create("div", {id:clickedBuildingNumber , class: "buildingFloorContainer"}, "floorList");
			
			         //create a div that holds the building name and number
    		       var buildingInfo = clickedBuildingName + " (" + clickedBuildingNumber + ")"    		
    		       domConstruct.create("div", {innerHTML: buildingInfo + "<br>", id:buildingInfo , class: "buildingHeading"}, clickedBuildingNumber);

    		       //create a div and button that allows the building to be peristed in th widget, even after a different building gets selected
    		       domConstruct.create("div", {id:clickedBuildingNumber+"_functionContainer", class:"buidlingFunctionContainer"}, clickedBuildingNumber);
    		       domConstruct.create("button", {innerHTML: "Persist", id:clickedBuildingNumber + "_persist", class: "persistButton"}, clickedBuildingNumber+'_functionContainer');
    		       domConstruct.create("button", {innerHTML: "Remove", id:clickedBuildingNumber + "_remove", class: "removeButton", style:"display: none"}, clickedBuildingNumber+'_functionContainer');

    			     //do I need this?
    			     var bldg = clickedBuildingNumber

    		       on(dom.byId(clickedBuildingNumber + "_persist"), "click", function(e){

    			     var bldg_clone = dojo.clone( dojo.byId(bldg));
    			     domConstruct.empty(floorList);
    			     domConstruct.create("div", {innerHTML:"<br>Select a building footprint on the map.<br><br>"}, "floorList");

    			     dojo.place(bldg_clone, "persistedfloorList", 0);

				    	 //assign actions to buttons AGAIN becasue CLONE does not come the event handlers.
    					 arrayUtil.forEach(clickedBuildingFloors, function(data){
    							var floor = data[0]

    							//do I need this?
    							var bldg = clickedBuildingNumber

    							//this var is only used to give html element a unique id
    							var building_floor = clickedBuildingNumber + '-' + floor
				    			on(dom.byId(building_floor + "_select"), "click", function(e){

    				         //remove the selectedFloorButton style from any floor buttons of this building,
                             //then give the clicked button the selectedFloorButton style
					           manageButtonSymbol(bldg, building_floor + "_select");

            		     //if current def query already contains that buildingnumber then erase that part of the query and add the query for the selected floor
            		     if (wallsLayer.getDefinitionExpression().indexOf(bldg) > -1){
            			      defQuery = wallsLayer.getDefinitionExpression()
            			      var regex = new RegExp(floorIDFieldname +" = '...?' AND "+ wallsLayerBldgIDField +" = '" + bldg + "'");
						            defQuery2 = wallsLayer.getDefinitionExpression().replace(regex, floorIDFieldname+" = '" + floor + "' AND "+wallsLayerBldgIDField+" = '"+ bldg +"'")
            			      wallsLayer.setDefinitionExpression(defQuery2);
            			      roomsLayer.setDefinitionExpression(defQuery2);
            		       }

            		     //if current def query does NOT already that buildingnumber then just add OR and the query for the selected floor
            		     if (wallsLayer.getDefinitionExpression().indexOf(bldg) === -1){
            			       wallsLayer.setDefinitionExpression(wallsLayer.getDefinitionExpression()+ " OR " + "("+floorIDFieldname+" = '" + floor + "' AND "+wallsLayerBldgIDField+" = '"+ bldg +"')")
            			       roomsLayer.setDefinitionExpression(roomsLayer.getDefinitionExpression()+ " OR " + "("+floorIDFieldname+" = '" + floor + "' AND "+wallsLayerBldgIDField+" = '"+ bldg +"')")
            			      }
				    			});
							  });

		    		    on(dom.byId(clickedBuildingNumber + "_remove"), "click", function(e){
		    			    domConstruct.destroy(bldg);
            			defQuery = wallsLayer.getDefinitionExpression()
            			var regex = new RegExp(" OR ."+floorIDFieldname+" = '...?' AND "+wallsLayerBldgIDField+" = '" + bldg + "'.");
						      defQuery2 = wallsLayer.getDefinitionExpression().replace(regex,"")
            			wallsLayer.setDefinitionExpression(defQuery2);
            			roomsLayer.setDefinitionExpression(defQuery2);
		    		    })

		    			domStyle.set(clickedBuildingNumber + "_persist", {"display": "none"});
		    			domStyle.set(clickedBuildingNumber + "_remove", {"display": ""});
    		      })

			    //create a div for each floor
    		  arrayUtil.forEach(clickedBuildingFloors, function(data){
    			  var floor = data[0]

    			  //do I need this? test...
    			  var bldg = clickedBuildingNumber

    			  //this var is only used to give html element a unique id
    			  var building_floor = clickedBuildingNumber + '-' + floor

    			  //create the div for the row of buttons
    			  domConstruct.create("div", {id:building_floor + "_row", style:"display:inline; clear:both;"}, clickedBuildingNumber,1);

    			  //create the select floor button
    			  domConstruct.create("button", {innerHTML: floor, id:building_floor + "_select", class: "floorButton"}, building_floor + "_row");

    			  //assign actions to the select floor button
    			  on(dom.byId(building_floor + "_select"), "click", function(e){

    				  //remove the selectedFloorButton style from any floor buttons of this building,
    				  //then give the clicked button the selectedFloorButton style
					    manageButtonSymbol(bldg, building_floor + "_select");

            		//if current def query already contains that buildingnumber then erase that part of the query and add the query for the selected floor
            		if (wallsLayer.getDefinitionExpression().indexOf(bldg) > -1){
            			defQuery = wallsLayer.getDefinitionExpression()
            			var regex = new RegExp(floorIDFieldname+" = '...?' AND "+wallsLayerBldgIDField+" = '" + bldg + "'");
						      defQuery2 = wallsLayer.getDefinitionExpression().replace(regex, floorIDFieldname+" = '" + floor + "' AND "+wallsLayerBldgIDField+" = '"+ bldg +"'" )
            			wallsLayer.setDefinitionExpression(defQuery2);
            			roomsLayer.setDefinitionExpression(defQuery2);
            		}
            		//if current def query does NOT already that buildingnumber then just add OR and the query for the selected floor
            		if (wallsLayer.getDefinitionExpression().indexOf(bldg) === -1){
            			wallsLayer.setDefinitionExpression(wallsLayer.getDefinitionExpression()+ " OR " + "("+floorIDFieldname+" = '" + floor + "' AND "+wallsLayerBldgIDField+" = '"+ bldg +"')")
            			roomsLayer.setDefinitionExpression(roomsLayer.getDefinitionExpression()+ " OR " + "("+floorIDFieldname+" = '" + floor + "' AND "+wallsLayerBldgIDField+" = '"+ bldg +"')")
            			}
    				});
    			});

     //where is the opeing parenthesis for this one??? is it needed???
		 };

		 //this function is called when a feature in the buildingsLayer is clicked. It queries the wallsLayer to see what floor are 
		 //available for the selected building and then calls addFloorsToSlider, passign the information returned form that query. 
		 function buildFloorSwitcher(e){
		 	 clickedBuildingNumber = e.graphic.attributes[buildingIDFieldname]; //app parameter
		 	 clickedBuildingName = e.graphic.attributes[buidlingNameFieldname]; //app parameter

		 	 //do that before assigning a new value to clickedBuildingNumber. To deal with if buildign is already in persisted floor.
    	 if (typeof clickedBuildingNumber != 'undefined'){
    	 	
             //check if we have a currently selected (not a persisted) building with a toggled-on floorlevel. If so then
             //empty the floorlist and if needed remove the last appended building from the definition query
    	     floorListSelectedFloorButtons = dojo.query(".selectedFloorButton", "floorList")
             domConstruct.empty(floorList);
             if (floorListSelectedFloorButtons.length > 0){ 
                console.log(floorListSelectedFloorButtons)
                console.log(wallsLayer.getDefinitionExpression());
                currentDefQuery = wallsLayer.getDefinitionExpression()
                lastAddedBuilding = currentDefQuery.split(' OR ').pop();
                newDefQuery = currentDefQuery.replace(' OR ' + lastAddedBuilding,'')
                wallsLayer.setDefinitionExpression(newDefQuery)
                roomsLayer.setDefinitionExpression(newDefQuery)
                console.log(wallsLayer.getDefinitionExpression());
                };

             //if the building exists as a persisted building remove it from that section    		
             l = dojo.query(".buildingFloorContainer","persistedfloorList");
    	     arrayUtil.forEach(l, function(elem){
    	     if (elem.id === clickedBuildingNumber){
    		domConstruct.destroy(clickedBuildingNumber)}
    	     })
    	 };

			 var query = new Query();
			 var queryTask = new QueryTask(wallsLayerURL);
			 query.where = wallsLayerBldgIDField+" = '" + clickedBuildingNumber + "'";
			 query.outSpatialReference = {wkid:102100};
			 query.returnGeometry = false;
			 query.outFields = [floorIDFieldname, wallsLayerSortField];
			 queryTask.execute(query, addFloorsToSlider);
		 };

//BEGIN code for adding global level switching functionality
		function addAllFloors (results2){

            allUniqueFloors = results2
		 	//add a button for every floor
			arrayUtil.forEach(allUniqueFloors, function(floor){
				domConstruct.create("button", {innerHTML: floor, id:floor + "_select", class: "floorButton"}, "floorList", "last");
				//assign actions to the select floor button
    			on(dom.byId(floor + "_select"), "click", function(e){

    			  //remove the selectedFloorButton style from any floor in the floorList
    			  //then give the clicked button the selectedFloorButton style
					  manageButtonSymbol("floorList", floor + "_select");

            //set the query for the selected floor
            wallsLayer.setDefinitionExpression(floorIDFieldname+" = '" + floor + "'")
            roomsLayer.setDefinitionExpression(floorIDFieldname+" = '" + floor + "'")            			
          });
			});
		};


//byAll tab
               var query2 = new Query();
               var queryTask2 = new QueryTask(wallsLayerURL);
               query2.where = "1=1";
               query2.outSpatialReference = {wkid:102100};
               query2.returnGeometry = false;
               query2.outFields = [floorIDFieldname];
               //queryTask2.execute(query2, addAllFloors);
               queryTask2.execute(query2, storeAllFloors);

                function storeAllFloors (results){

            var l = []
            for (var i = 0; i < results.features.length; i++) {
                l.push(results.features[i].attributes[floorIDFieldname]);  //make app parameter
            }

            var allUniqueFloors = []
            dojo.forEach(l, function(item, i) {
                 if(dojo.indexOf(allUniqueFloors, item)  == -1) {
                  allUniqueFloors.push(item);
                  }
                });
            allUniqueFloors.sort()
                    allFloors = allUniqueFloors
                }

    	on(dom.byId("all"), "click", function(e){
    	   domClass.remove("all")
    	   domClass.add("all", "selectedModeButton");

    	   domClass.remove("bySQL")
    	   domClass.add("bySQL", "modeButton");

    	   domClass.remove("byBldg")
    	   domClass.add("byBldg", "modeButton");    	 

         //remove all floors form the widget's floorList html element
         domConstruct.empty("floorList");
         domConstruct.empty("persistedfloorList");
         
         //add a help message
         domConstruct.create("div", {innerHTML:"<br>Select the floor level to display.<br>"}, "floorList");

         //hide all rooms and walls
		 wallsLayer.setDefinitionExpression("OBJECTID < 1");
         roomsLayer.setDefinitionExpression("OBJECTID < 1");

         //unregister function from buildingsLayer click event
		     buildingsLayerClick.remove(); 
             addAllFloors(allFloors);
    	});

//END code for adding global level switching functionality

//by Bldg tab
    	on(dom.byId("byBldg"), "click", function(e){
    	   domClass.remove("all")
    	   domClass.add("all", "modeButton");

    	   domClass.remove("bySQL")
    	   domClass.add("bySQL", "modeButton");

    	   domClass.remove("byBldg")
    	   domClass.add("byBldg", "selectedModeButton");  

         //remove all floors form the widget's floorList html element
         domConstruct.empty("floorList");
         domConstruct.empty("persistedfloorList");

         //add a help message
         domConstruct.create("div", {innerHTML:"<br>Select a building footprint on the map.<br><br>"}, "floorList");

         //hide all rooms and walls
		     wallsLayer.setDefinitionExpression("OBJECTID < 1");
         roomsLayer.setDefinitionExpression("OBJECTID < 1");
         
         //unregister function from buildingsLayer click event
		     buildingsLayerClick.remove(); 

         //register function buildFloorSwitcher with the buildingsLayer
         buildingsLayerClick  = buildingsLayer.on("click", buildFloorSwitcher);
    	});

//bySQL tab
    	 on(dom.byId("bySQL"), "click", function(e){

    	    domClass.remove("all")
    	    domClass.add("all", "modeButton");

    	    domClass.remove("byBldg")
    	    domClass.add("byBldg", "modeButton");  

    	    domClass.remove("bySQL")
    	    domClass.add("bySQL", "selectedModeButton"); 

          //remove all floors form the widget's floorList html element
          domConstruct.empty("floorList");
          domConstruct.empty("persistedfloorList");         

          //hide all rooms and walls
		      wallsLayer.setDefinitionExpression("OBJECTID < 1");
          roomsLayer.setDefinitionExpression("OBJECTID < 1");
         
		      // create a textbox for sql input
		      domConstruct.create("div", {innerHTML:"<br>Set a SQL query:"}, "floorList");
		      domConstruct.create("textarea", {id:'value0Box', rows:"5" ,value:"For example enter BUILDING = '202' to see all floors of building 202. Or enter FLOOR LIKE '%B' to see all floors that end with the letter B.", style: "width:100%;"}, "floorList");
     	    domConstruct.create("button", {innerHTML: "Set Query", id:"setQuery", class: "persistButton", style:"text-align: right; padding: 5px;"}, 'persistedfloorList');

    	    on(dom.byId("setQuery"), "click", function(e){
		         wallsLayer.setDefinitionExpression(domAttr.get("value0Box", 'value'));
             roomsLayer.setDefinitionExpression(domAttr.get("value0Box", 'value'));
    	    });

          //unregister function from buildingsLayer click event
		      buildingsLayerClick.remove(); 
    	});

//where does this one open???
      },

       onClose: function(){
         console.log('onClose');
         allLayers = this.map.graphicsLayerIds;

         buildingsLayer = this.map.getLayer(this.map.graphicsLayerIds[this.config.buildingsLayerNumber]); //app parameter
         wallsLayer = this.map.getLayer(this.map.graphicsLayerIds[this.config.wallsLayerNumber]); //app parameter
         roomsLayer = this.map.getLayer(this.map.graphicsLayerIds[this.config.roomsLayerNumber]); //app parameter

         //remove all floors form the widget's floorList html element
         domConstruct.empty("floorList");
         domConstruct.empty("persistedfloorList");

           domClass.remove("all")
           domClass.add("all", "modeButton");

           domClass.remove("bySQL")
           domClass.add("bySQL", "modeButton");

           domClass.remove("byBldg")
           domClass.add("byBldg", "selectedModeButton");   

         //hide all rooms and walls
		 //wallsLayer.setDefinitionExpression("OBJECTID < 1");
         //roomsLayer.setDefinitionExpression("OBJECTID < 1");
         config = this.config
         wallsLayer.setDefinitionExpression(config.wallsLayer_origfilter);
         roomsLayer.setDefinitionExpression(config.roomsLayer_origfilter);
         //console.log(roomsLayer.getDefinitionExpression)


         //unregister function from buildingsLayer click event
		     buildingsLayerClick.remove();         
       }//,
      // onMinimize: function(){
      //   console.log('onMinimize');
      // },

      // onMaximize: function(){
      //   console.log('onMaximize');
      // },

      // onSignIn: function(credential){
      //   /* jshint unused:false*/
      //   console.log('onSignIn');
      // },

      // onSignOut: function(){
      //   console.log('onSignOut');
      // }

      // onPositionChange: function(){
      //   console.log('onPositionChange');
      // },

      // resize: function(){
      //   console.log('resize');
      // }

      //methods to communication between widgets:

    });
  });
