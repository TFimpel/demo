///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'jimu/BaseWidgetSetting',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/form/NumberTextBox',
    'dijit/form/CheckBox'
  ],
  function(
    declare,
    BaseWidgetSetting,
    _WidgetsInTemplateMixin) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-floorSwitcher-setting',

      startup: function() {
        this.inherited(arguments);
        this.setConfig(this.config);
      },

      setConfig: function(config) {
        //this.config = config;
        console.log("no running line before set...")
        this.buildingsLayerNumber.set('value', config.buildingsLayerNumber);
        this.buildingID.set('value', config.buildingID);
        this.buidlingName.set('value', config.buidlingName);
        this.roomsLayerNumber.set('value', config.roomsLayerNumber);
        this.wallsLayerNumber.set('value', config.wallsLayerNumber);
        this.floorID.set('value', config.floorID);
        this.wallsLayerBldgIDField.set('value', config.wallsLayerBldgIDField);
        this.wallsLayerSortField.set('value', config.wallsLayerSortField);
      },

      getConfig: function() {
        console.log('not quite sure what this is about...')
        this.config.buildingsLayerNumber = this.buildingsLayerNumber.value;
        this.config.buildingID = this.buildingID.value;
        this.config.buidlingName = this.buidlingName.value;
        this.config.roomsLayerNumber = this.roomsLayerNumber.value;
        this.config.wallsLayerNumber = this.wallsLayerNumber.value;
        this.config.floorID = this.floorID.value;
        this.config.wallsLayerBldgIDField = this.wallsLayerBldgIDField.value;
        this.config.wallsLayerSortField = this.wallsLayerSortField.value;

        //example of a checkbox value
        //this.config.legend.autoUpdate = this.autoUpdate.checked;
        return this.config;
      }
    });
  });
