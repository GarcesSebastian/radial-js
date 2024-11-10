"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Radial = void 0;
var Circle_1 = require("./class/Shapes/Circle");
var Rect_1 = require("./class/Shapes/Rect");
var Triangle_1 = require("./class/Shapes/Triangle");
var Line_1 = require("./class/Shapes/Line");
var Radial = /** @class */ (function () {
    function Radial(ctx) {
        this.children = [];
        this.isDragging = false;
        this.dragStartPos = null;
        if (!ctx) {
            console.error("No se proporcionó un contexto de canvas válido.");
            return;
        }
        this.ctx = ctx;
        this.events = {};
        this.addEventListeners();
    }
    Radial.prototype.addEventListeners = function () {
        var _this = this;
        this.ctx.canvas.addEventListener("click", function (event) {
            _this.emit("click", event);
        });
        this.ctx.canvas.addEventListener("mousemove", function (event) {
            _this.emit("mousemove", event);
            if (_this.isDragging && _this.dragStartPos) {
                _this.emit("dragmove", event);
            }
        });
        this.ctx.canvas.addEventListener("mousedown", function (event) {
            _this.isDragging = true;
            _this.dragStartPos = { x: event.offsetX, y: event.offsetY };
            _this.emit("dragstart", event);
        });
        this.ctx.canvas.addEventListener("mouseup", function (event) {
            if (_this.isDragging) {
                _this.emit("dragend", event);
                _this.isDragging = false;
                _this.dragStartPos = null;
            }
        });
        this.ctx.canvas.addEventListener("wheel", function (event) {
            _this.emit("wheel", event);
        });
    };
    Radial.prototype.getCtx = function () {
        return this.ctx;
    };
    Radial.prototype.getChildren = function () {
        return this.children;
    };
    Radial.prototype.on = function (event, handler) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(handler);
    };
    Radial.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (this.events[event]) {
            this.events[event].forEach(function (handler) { return handler.apply(void 0, args); });
        }
    };
    Radial.prototype.off = function (event, handler) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(function (h) { return h !== handler; });
        }
    };
    Radial.prototype.Circle = function (config) {
        return new Circle_1.Circle(this, config);
    };
    Radial.prototype.Rect = function (config) {
        return new Rect_1.Rect(this, config);
    };
    Radial.prototype.Triangle = function (config) {
        return new Triangle_1.Triangle(this, config);
    };
    Radial.prototype.Line = function (config) {
        return new Line_1.Line(this, config);
    };
    return Radial;
}());
exports.Radial = Radial;
//# sourceMappingURL=Radial.js.map