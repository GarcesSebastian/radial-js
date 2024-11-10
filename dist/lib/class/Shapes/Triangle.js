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
exports.Triangle = void 0;
var Shape_1 = require("./Shape");
var Triangle = /** @class */ (function (_super) {
    __extends(Triangle, _super);
    function Triangle(radial, config) {
        var _this = _super.call(this, radial.getCtx(), config) || this;
        _this.shape = "Triangle";
        _this.isInitialized = false;
        _this.radial = radial;
        _this.config = config;
        _this.render();
        return _this;
    }
    Triangle.prototype.draw = function () {
        var _a = this.config, x = _a.x, y = _a.y, radius = _a.radius;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + radius, y + radius);
        this.ctx.lineTo(x - radius, y + radius);
        this.ctx.fill();
        this.ctx.closePath();
        if (!this.isInitialized) {
            this.radial.children.push(this);
            this.isInitialized = true;
        }
    };
    Triangle.prototype.getBoundingBox = function () {
        var _a = this.config, x = _a.x, y = _a.y, radius = _a.radius;
        return { x: x, y: y, radius: radius, shape: this.shape, radial: this.radial };
    };
    return Triangle;
}(Shape_1.Shape));
exports.Triangle = Triangle;
//# sourceMappingURL=Triangle.js.map