# Radial JS

Radial JS es una librería JavaScript para crear gráficos radiales de manera sencilla y eficiente.

## Características

- Fácil de usar e integrar
- Altamente personalizable
- Soporte para múltiples tipos de gráficos radiales
- Ligera y rápida

## Instalación

Puedes instalar Radial JS usando npm:

```bash
npm install radial-js
```

O puedes incluirlo directamente desde un CDN:

```html
<script src="https://cdn.example.com/radial-js/latest/radial.min.js"></script>
```

## Uso Básico

Aquí tienes un ejemplo básico de cómo usar Radial JS:

```javascript
import { Radial } from "radial-js";

const canvas = document.getElementById('cw');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const radial = new Radial(ctx);

const rect = radial.Rect({
    x: 300,
    y: 50,
    width: 100,
    height: 100,
    color: 'blue',
    borderColor: "red",
    borderWidth: 2,
    borderRadius: 5,
    shadowColor: "yellow",
    shadowOffset: {x: 0, y: 0},
    shadowBlur: 10,
    draggable: true
});

const circle = radial.Circle({
    x: 100,
    y: 100,
    radius: 100,
    color: 'yellow',
    draggable: true
});

const triangle = radial.Triangle({
    x: 500,
    y: 100,
    radius: 50,
    color: 'green',
    draggable: true
});

const line = radial.Line({
    points: [100, 100, 200, 200, 300, 200],
    color: 'red',
    lineWidth: 10,
    lineCap: 'round',
    draggable: true
});

radial.on("click", (event) => {
    console.log("Click canvas", event)
});

radial.on("mousemove", (event) => {
});

radial.on("mouseup", (event) => {
    console.log("Up canvas", event)
});

radial.on("mousedown", (event) => {
    console.log("Down canvas", event)
});

radial.on("wheel", (event) => {
    console.log("Wheel canvas", event)
});

radial.on("dragstart", (event) => {
    console.log("Arrastre iniciado en:", event.offsetX, event.offsetY);
});

radial.on("dragmove", (event) => {
    console.log("Arrastre en movimiento a:", event.offsetX, event.offsetY);
});

radial.on("dragend", (event) => {
    console.log("Arrastre finalizado en:", event.offsetX, event.offsetY);
});

radial.getChildren().forEach((item) => {
    item.on("click", (event) => {
        item.destroy();
    });
})

rect.on("dragstart", (event) => {
    console.log("Comenzó el arrastre:", event.x, event.y);
});

rect.on("drag", (event) => {
    console.log("Arrastrando a:", event.x, event.y);
});

rect.on("dragend", (event) => {
    console.log("Terminó el arrastre en:", event.x, event.y);
});
```

## Documentación

Para más detalles y opciones avanzadas, consulta la [documentación oficial](https://example.com/radial-js/docs).

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o envía un pull request en [GitHub](https://github.com/tuusuario/radial-js).

## Licencia

Radial JS está licenciado bajo la [MIT License](LICENSE).
