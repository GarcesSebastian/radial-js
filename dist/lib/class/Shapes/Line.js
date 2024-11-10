"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Line = void 0;
var Shape_1 = require("./Shape");
var Line = /** @class */ (function (_super) {
    __extends(Line, _super);
    function Line(radial, config) {
        var _this = _super.call(this, radial.getCtx(), config) || this;
        _this.shape = "Line";
        _this.isInitialized = false;
        _this.radial = radial;
        _this.config = config;
        _this.setProperties();
        _this.render();
        return _this;
    }
    Line.prototype.setProperties = function () {
        var _a = this.config, lineWidth = _a.lineWidth, lineJoin = _a.lineJoin, lineCap = _a.lineCap, dashArray = _a.dashArray;
        if (lineWidth)
            this.ctx.lineWidth = lineWidth;
        if (lineJoin)
            this.ctx.lineJoin = lineJoin;
        if (lineCap)
            this.ctx.lineCap = lineCap;
        if (dashArray)
            this.ctx.setLineDash(dashArray);
    };
    Line.prototype.draw = function () {
        this.ctx.beginPath();
        for (var i = 0; i < this.config.points.length; i += 2) {
            var x = this.config.points[i];
            var y = this.config.points[i + 1];
            i === 0 ? this.ctx.moveTo(x, y) : this.ctx.lineTo(x, y);
        }
        this.ctx.strokeStyle = this.config.color;
        this.ctx.stroke();
        this.ctx.closePath();
        if (!this.isInitialized) {
            this.radial.children.push(this);
            this.isInitialized = true;
        }
    };
    Line.prototype.getBoundingBox = function () {
        var _a = this.config, x = _a.x, y = _a.y, points = _a.points, lineWidth = _a.lineWidth;
        return { x: x, y: y, points: points, lineWidth: lineWidth, shape: this.shape, radial: this.radial };
    };
    return Line;
}(Shape_1.Shape));
exports.Line = Line;
//# sourceMappingURL=Line.js.map