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
exports.Circle = void 0;
var Shape_1 = require("./Shape");
var Circle = /** @class */ (function (_super) {
    __extends(Circle, _super);
    function Circle(radial, config) {
        var _this = _super.call(this, radial.getCtx(), config) || this;
        _this.shape = "Circle";
        _this.isInitialized = false;
        _this.radial = radial;
        _this.config = config;
        _this.render();
        return _this;
    }
    Circle.prototype.draw = function () {
        var _a = this.config, x = _a.x, y = _a.y, radius = _a.radius;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2, true);
        this.ctx.fill();
        this.ctx.closePath();
        if (!this.isInitialized) {
            this.radial.children.push(this);
            this.isInitialized = true;
        }
    };
    Circle.prototype.getBoundingBox = function () {
        var _a = this.config, x = _a.x, y = _a.y, radius = _a.radius;
        return { x: x, y: y, radius: radius, shape: this.shape, radial: this.radial };
    };
    return Circle;
}(Shape_1.Shape));
exports.Circle = Circle;
//# sourceMappingURL=Circle.js.map