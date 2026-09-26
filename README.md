# Satelit Tester - CanSat Telemetry Simulator

Rozšírenie (Extension) pre Microsoft MakeCode micro:bit slúžiace na komplexnú simuláciu letu atmosférickej sondy a telemetrického prenosu dát.

## Použitie ako blok

Tento balíček pridáva vlastnú kategóriu **Satelit tester** s tyrkysovou farbou a ikonou zameriavača.

### Spustenie simulácie
Blok obsahuje nastaviteľný posuvník (slider) chybovosti od 0 do 100 %.
* **0 %** = Úplne čistý a hladký let bez akýchkoľvek výpadkov hardvéru alebo anomálií.
* **100 %** = Simulácia kritického zlyhania, generovanie chýb senzorov (`err`), prekračovanie rozsahov (`warning`) a simulácia straty GPS satelitov.

## Príklad zapojenia v MakeCode

```blocks
input.onButtonPressed(Button.A, function () {
    SatelitTester.spustiSimulaciu(15)
})
```

## Podporované terče
* micro:bit v1 a v2
