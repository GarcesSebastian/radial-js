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
exports.Rect = void 0;
var Shape_1 = require("./Shape");
var Rect = /** @class */ (function (_super) {
    __extends(Rect, _super);
    function Rect(radial, config) {
        var _this = _super.call(this, radial.getCtx(), config) || this;
        _this.shape = "Rect";
        _this.isInitialized = false;
        _this.radial = radial;
        _this.config = config;
        _this.render();
        return _this;
    }
    Rect.prototype.draw = function () {
        var _a = this.config, x = _a.x, y = _a.y, width = _a.width, height = _a.height, borderRadius = _a.borderRadius;
        this.ctx.beginPath();
        if (borderRadius) {
            this.ctx.moveTo(x + borderRadius, y);
            this.ctx.arcTo(x + width, y, x + width, y + height, borderRadius);
            this.ctx.arcTo(x + width, y + height, x, y + height, borderRadius);
            this.ctx.arcTo(x, y + height, x, y, borderRadius);
            this.ctx.arcTo(x, y, x + width, y, borderRadius);
        }
        else {
            this.ctx.rect(x, y, width, height);
        }
        this.ctx.fill();
        this.ctx.closePath();
        if (!this.isInitialized) {
            this.radial.children.push(this);
            this.isInitialized = true;
        }
    };
    Rect.prototype.getBoundingBox = function () {
        var _a = this.config, x = _a.x, y = _a.y, width = _a.width, height = _a.height;
        return { x: x, y: y, width: width, height: height, shape: this.shape, radial: this.radial };
    };
    return Rect;
}(Shape_1.Shape));
exports.Rect = Rect;
//# sourceMappingURL=Rect.js.map