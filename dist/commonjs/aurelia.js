"use strict";

var _interopRequireWildcard = function (obj) {
  return obj && obj.constructor === Object ? obj : {
    "default": obj
  };
};

var LogManager = _interopRequireWildcard(require("aurelia-logging"));

var Container = require("aurelia-dependency-injection").Container;
var Loader = require("aurelia-loader").Loader;
var BindingLanguage = require("aurelia-templating").BindingLanguage;
var ResourceCoordinator = require("aurelia-templating").ResourceCoordinator;
var ViewSlot = require("aurelia-templating").ViewSlot;
var ResourceRegistry = require("aurelia-templating").ResourceRegistry;
var CompositionEngine = require("aurelia-templating").CompositionEngine;
var Plugins = require("./plugins").Plugins;


var logger = LogManager.getLogger("aurelia");

var Aurelia = function Aurelia(loader, container, resources) {
  this.loader = loader || Loader.createDefaultLoader();
  this.container = container || new Container();
  this.resources = resources || new ResourceRegistry();
  this.resourcesToLoad = [];
  this.plugins = new Plugins(this);

  this.withInstance(Aurelia, this);
  this.withInstance(Loader, this.loader);
  this.withInstance(ResourceRegistry, this.resources);
};

Aurelia.prototype.withInstance = function (type, instance) {
  this.container.registerInstance(type, instance);
  return this;
};

Aurelia.prototype.withSingleton = function (type, implementation) {
  this.container.registerSingleton(type, implementation);
  return this;
};

Aurelia.prototype.withResources = function (resources) {
  if (Array.isArray(resources)) {
    this.resourcesToLoad = this.resourcesToLoad.concat(resources);
  } else {
    this.resourcesToLoad = this.resourcesToLoad.concat(Array.prototype.slice.call(arguments));
  }

  return this;
};

Aurelia.prototype.start = function () {
  var _this = this;
  if (this.started) {
    return;
  }

  this.started = true;
  logger.info("Aurelia Starting");

  return this.plugins.process().then(function () {
    if (!_this.container.hasHandler(BindingLanguage)) {
      logger.error("You must configure Aurelia with a BindingLanguage implementation.");
    }

    return _this.container.get(ResourceCoordinator).importResources(_this.resourcesToLoad).then(function (resources) {
      resources.forEach(function (x) {
        return x.register(_this.resources);
      });
      logger.info("Aurelia Started");
      return _this;
    });
  });
};

Aurelia.prototype.setRoot = function (root, applicationHost) {
  var _this2 = this;
  var compositionEngine, instruction = {};

  if (!applicationHost || typeof applicationHost == "string") {
    this.host = document.getElementById(applicationHost || "applicationHost") || document.body;
  } else {
    this.host = applicationHost;
  }

  this.host.aurelia = this;
  this.container.registerInstance(Element, this.host);

  compositionEngine = this.container.get(CompositionEngine);
  instruction.viewModel = root;
  instruction.viewSlot = new ViewSlot(this.host, true);
  instruction.container = instruction.childContainer = this.container;

  return compositionEngine.compose(instruction).then(function (root) {
    _this2.root = root;
    instruction.viewSlot.attached();
    return _this2;
  });
};

exports.Aurelia = Aurelia;