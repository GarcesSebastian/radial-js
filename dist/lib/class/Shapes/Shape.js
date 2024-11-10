"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shape = void 0;
var Shape = /** @class */ (function () {
    function Shape(ctx, config) {
        var _a;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.initialX = 0;
        this.initialY = 0;
        this.ctx = ctx;
        this.config = __assign(__assign({}, config), { draggable: (_a = config.draggable) !== null && _a !== void 0 ? _a : false });
        this.events = {};
        this.addEventListeners();
    }
    Shape.prototype.applyStyles = function () {
        var _a = this.config, color = _a.color, borderWidth = _a.borderWidth, borderColor = _a.borderColor, shadowColor = _a.shadowColor, shadowBlur = _a.shadowBlur, shadowOffset = _a.shadowOffset;
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0)';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        if (shadowColor) {
            this.ctx.shadowColor = shadowColor;
        }
        if (shadowBlur !== undefined) {
            this.ctx.shadowBlur = shadowBlur;
        }
        if (shadowOffset) {
            this.ctx.shadowOffsetX = shadowOffset.x;
            this.ctx.shadowOffsetY = shadowOffset.y;
        }
        if (borderWidth && borderColor) {
            this.ctx.lineWidth = borderWidth;
            this.ctx.strokeStyle = borderColor;
        }
        this.ctx.fillStyle = color;
    };
    Shape.prototype.addEventListeners = function () {
        var _this = this;
        this.ctx.canvas.addEventListener("click", function (event) {
            var rect = _this.getBoundingBox();
            if (_this.isPointInShape(event.offsetX, event.offsetY, rect)) {
                _this.emit("click", {
                    children: rect.radial.getChildren(),
                    event: event
                });
            }
        });
        this.ctx.canvas.addEventListener("mousemove", function (event) {
            var rect = _this.getBoundingBox();
            if (_this.isPointInShape(event.offsetX, event.offsetY, rect)) {
                _this.emit("mousemove", event);
            }
            else if (_this.config.draggable && !_this.isDragging) {
                _this.ctx.canvas.style.cursor = 'default';
            }
            if (_this.isDragging && _this.config.draggable) {
                var dx = event.offsetX - _this.dragStartX;
                var dy = event.offsetY - _this.dragStartY;
                _this.config.x = _this.initialX + dx;
                _this.config.y = _this.initialY + dy;
                var radial = _this.getBoundingBox().radial;
                _this.redrawCanvas(radial);
                _this.emit("drag", {
                    x: _this.config.x,
                    y: _this.config.y,
                    event: event
                });
            }
        });
        this.ctx.canvas.addEventListener("mousedown", function (event) {
            var rect = _this.getBoundingBox();
            if (_this.isPointInShape(event.offsetX, event.offsetY, rect)) {
                _this.emit("mousedown", event);
                if (_this.config.draggable) {
                    _this.isDragging = true;
                    _this.dragStartX = event.offsetX;
                    _this.dragStartY = event.offsetY;
                    _this.initialX = _this.config.x;
                    _this.initialY = _this.config.y;
                    _this.emit("dragstart", {
                        x: _this.config.x,
                        y: _this.config.y,
                        event: event
                    });
                }
            }
        });
        this.ctx.canvas.addEventListener("mouseup", function (event) {
            var rect = _this.getBoundingBox();
            if (_this.isPointInShape(event.offsetX, event.offsetY, rect)) {
                _this.emit("mouseup", event);
            }
            if (_this.isDragging && _this.config.draggable) {
                _this.isDragging = false;
                _this.emit("dragend", {
                    x: _this.config.x,
                    y: _this.config.y,
                    event: event
                });
            }
        });
        this.ctx.canvas.addEventListener("mouseleave", function () {
            if (_this.isDragging && _this.config.draggable) {
                _this.isDragging = false;
                _this.emit("dragend", {
                    x: _this.config.x,
                    y: _this.config.y
                });
            }
        });
    };
    Shape.prototype.isPointInShape = function (x, y, rect) {
        if (rect.shape === "Rect") {
            return (x >= rect.x && x <= rect.x + rect.width &&
                y >= rect.y && y <= rect.y + rect.height);
        }
        else if (rect.shape === "Circle") {
            var dx = x - rect.x;
            var dy = y - rect.y;
            return dx * dx + dy * dy <= rect.radius * rect.radius;
        }
        else if (rect.shape === "Triangle") {
            var x1 = rect.x;
            var y1 = rect.y;
            var x2 = rect.x + rect.radius;
            var y2 = rect.y + rect.radius;
            var x3 = rect.x - rect.radius;
            var y3 = rect.y + rect.radius;
            var totalArea = this.calculateArea(x1, y1, x2, y2, x3, y3);
            var area1 = this.calculateArea(x, y, x2, y2, x3, y3);
            var area2 = this.calculateArea(x1, y1, x, y, x3, y3);
            var area3 = this.calculateArea(x1, y1, x2, y2, x, y);
            return Math.abs(totalArea - (area1 + area2 + area3)) < 0.1;
        }
        else if (rect.shape === "Line") {
            var points = rect.points, lineWidth = rect.lineWidth;
            var isInside = false;
            for (var i = 0; i < points.length; i += 2) {
                var x1 = points[i];
                var y1 = points[i + 1];
                var x2 = i + 2 < points.length ? points[i + 2] : points[0];
                var y2 = i + 2 < points.length ? points[i + 3] : points[1];
                var dx = x2 - x1;
                var dy = y2 - y1;
                var length_1 = Math.sqrt(dx * dx + dy * dy);
                var t = ((x - x1) * dx + (y - y1) * dy) / (length_1 * length_1);
                if (t >= 0 && t <= 1) {
                    var closestX = x1 + t * dx;
                    var closestY = y1 + t * dy;
                    var distance = Math.sqrt((x - closestX) * (x - closestX) +
                        (y - closestY) * (y - closestY));
                    if (distance <= lineWidth / 2) {
                        isInside = true;
                        break;
                    }
                }
            }
            return isInside;
        }
        return false;
    };
    Shape.prototype.calculateArea = function (x1, y1, x2, y2, x3, y3) {
        return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2);
    };
    Shape.prototype.getBoundingBox = function () {
        throw new Error("Method 'getBoundingBox()' must be implemented.");
    };
    Shape.prototype.on = function (event, handler) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(handler);
    };
    Shape.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (this.events[event]) {
            this.events[event].forEach(function (handler) { return handler.apply(void 0, args); });
        }
    };
    Shape.prototype.off = function (event, handler) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(function (h) { return h !== handler; });
        }
    };
    Shape.prototype.draw = function () {
        throw new Error("Method 'draw()' must be implemented.");
    };
    Shape.prototype.destroy = function () {
        var radial = this.getBoundingBox().radial;
        var index = radial.children.indexOf(this);
        if (index !== -1) {
            radial.children.splice(index, 1);
        }
        this.redrawCanvas(radial);
        this.removeEventListeners();
    };
    Shape.prototype.removeEventListeners = function () {
        this.events = {};
    };
    Shape.prototype.redrawCanvas = function (radial) {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        radial.children.forEach(function (shape) {
            shape.render();
        });
    };
    Shape.prototype.render = function () {
        this.applyStyles();
        this.draw();
        if (this.config.borderWidth && this.config.borderColor) {
            this.ctx.stroke();
        }
        this.ctx.restore();
    };
    return Shape;
}());
exports.Shape = Shape;
//# sourceMappingURL=Shape.js.map