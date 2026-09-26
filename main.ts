//% color="#00adb5" icon="\uf140" block="Satelit tester"
namespace SatelitTester {

    let aktualnaLat = 48.6150
    let aktualnaLon = 19.1500
    let casStartuLetu = 0
    let letZacaty = false
    let apogeeDosiahnute = false
    let pristatieDetegovane = false
    let pociatocnyTlak = 1012.4

    const DUR_STUPANIA = 15000
    const DUR_KLESANIA = 25000

    /**
     * Spustí kompletnú simuláciu letu CanSat sondy cez USB sériovú linku micro:bitu.
     * @param percentoChyb Pravdepodobnosť generovania chýb a anomálií (0-100%)
     */
    //% block="Spusti simuláciu letu s chybovosťou %percentoChyb"
    //% percentoChyb.min=0 percentoChyb.max=100
    export function spustiSimulaciu(percentoChyb: number): void {
        // Ochrana vstupu proti podtečeniu a pretečeniu (0-100)
        let chybovost = Math.max(0, Math.min(100, percentoChyb))

        // Odpočet pred štartom na 5x5 LED displeji
        for (let odpočet = 9; odpočet >= 0; odpočet--) {
            basic.showNumber(odpočet)
            basic.pause(600)
        }
        basic.clearScreen()

        // Inicializačná sekvencia (info správy)
        posliSpravu("info", "System sa spusta...")
        basic.pause(400)

        if (chybovost > 0 && Math.randomRange(1, 100) <= chybovost) {
            posliSpravu("err", "BME280 odpojeny")
        } else {
            posliSpravu("info", "BME280 najdeny na adrese 0x76")
        }

        posliSpravu("info", "MPU6050 inicializovany OK")
        posliSpravu("info", "SGP30 inicializovany OK")
        basic.pause(300)

        posliSpravu("info", "Ref_Tlak:" + pociatocnyTlak + "hPa,Ref_Teplota:22.4C")
        posliSpravu("info", "SD karta pripravena")
        posliSpravu("info", "Sonda pripravena na start")

        casStartuLetu = control.millis()

        // Hlavný telemetrický letový cyklus
        while (!pristatieDetegovane) {
            let aktualnyCas = control.millis()
            let letovyCas = aktualnyCas - casStartuLetu

            let vyska = 0.0
            let teplota = 22.4
            let vlhkost = 45.0
            let eco2 = 400
            let tvoc = 12
            let accX = 0.0
            let accY = 0.0
            let accZ = 1.0
            let gyroX = 0.0
            let gyroY = 0.0
            let gyroZ = 0.0

            if (letovyCas > (DUR_STUPANIA + DUR_KLESANIA)) {
                pristatieDetegovane = true
                posliSpravu("info", "DETEKCIA DOPADU. Let ukonceny.")
                posliSpravu("info", "Zachranne suradnice -> LAT: " + aktualnaLat + " LON: " + aktualnaLon)
                break
            }

            if (letovyCas <= DUR_STUPANIA) {
                if (!letZacaty && letovyCas > 200) {
                    letZacaty = true
                    posliSpravu("info", "DETEKCIA STARTU! Sonda stupa.")
                }
                let t = letovyCas / DUR_STUPANIA
                vyska = 1050.0 * (1.0 - (1.0 - t) * (1.0 - t))

                accZ = 1.2 + (Math.randomRange(-30, 30) / 100.0)
                gyroZ = Math.randomRange(-50, 50) / 100.0
            } else {
                if (!apogeeDosiahnute) {
                    apogeeDosiahnute = true
                    posliSpravu("info", "APOGEE DOSIAHNUTE. Padak otvoreny.")
                }
                let t = (letovyCas - DUR_STUPANIA) / DUR_KLESANIA
                vyska = 1050.0 * (1.0 - t)
                if (vyska < 0) vyska = 0

                gyroZ = 2.5 * Math.sin(letovyCas / 1000.0) + (Math.randomRange(-50, 50) / 100.0)
                accZ = 1.0 + (Math.randomRange(-10, 10) / 100.0)
            }

            // Výpočty hodnôt upravené pre celočíselné delenie v PXT
            teplota = 22.4 - (vyska * 0.0065)
            vlhkost = 45.0 + (vyska * 0.02)
            eco2 = Math.floor(450 - (vyska * 0.05))
            tvoc = Math.floor(15 - (vyska * 0.01))

            aktualnaLat += 0.000002
            aktualnaLon += 0.000004

            let nahodneCislo = Math.randomRange(1, 100)
            let chybaGenerovana = false

            if (chybovost > 0 && nahodneCislo <= chybovost) {
                let typChyby = Math.randomRange(1, 3)
                chybaGenerovana = true

                if (typChyby == 1) {
                    posliSpravu("err", "Chyba citania meteo dat")
                } else if (typChyby == 2) {
                    posliSpravu("warning", "Kriticka rotacia padaku: " + gyroZ)
                } else if (typChyby == 3) {
                    teplota = Math.randomRange(-150, 250)
                    vlhkost = Math.randomRange(150, 300)
                    posliSpravu("warning", "Hodnoty mimo rozsahu! T:" + teplota + " RH:" + vlhkost)
                }
            }

            if (chybovost > 0 && chybaGenerovana && Math.randomRange(1, 100) <= chybovost) {
                posliSpravu("warning", "Strata GPS signalu v lete (Zly Fix)")
                odosliDataRiadok(vyska, teplota, vlhkost, eco2, tvoc, accX, accY, accZ, gyroX, gyroY, gyroZ, 0.0, 0.0)
            } else {
                odosliDataRiadok(vyska, teplota, vlhkost, eco2, tvoc, accX, accY, accZ, gyroX, gyroY, gyroZ, aktualnaLat, aktualnaLon)
            }

            basic.pause(1000)
        }

        basic.showNumber(0)
    }

    function posliSpravu(typ: string, text: string): void {
        let riadok = typ + "," + control.millis() + "," + text
        serial.writeLine(riadok)
        // OPRAVENÁ SYNTAX: Bezpečný výsek prvého znaku kompatibilný s MakeCode
        zobraziPismeno(typ.substr(0, 1))
    }

    function odosliDataRiadok(vyska: number, temp: number, rh: number, co2: number, voc: number, ax: number, ay: number, az: number, gx: number, gy: number, gz: number, lat: number, lon: number): void {
        // Zrekonstruované spájanie pre korektný preklad do stringu bez pretečenia zásobníka
        let riadokDat = "data," + control.millis() + "," +
            vyska + "," + temp + "," + rh + "," + co2 + "," + voc + "," +
            ax + "," + ay + "," + az + "," + gx + "," + gy + "," + gz + "," +
            lat + "," + lon

        serial.writeLine(riadokDat)
        zobraziPismeno("d")
    }

    function zobraziPismeno(pismeno: string): void {
        basic.showString(pismeno, 0)
        basic.pause(150)
        basic.clearScreen()
    }
}
