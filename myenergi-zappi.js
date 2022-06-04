    /**
     * Script zum Auslesen der aktuellen Werte und setzen des ChargeModes und Mindest Green Levels einer Myenergi Zappi Wallbox
     * Als Basis für den Zugriff dient die myenergi-api https://github.com/bisand/myenergi-api
     * 
     * Anleitung:
     * ********** 
     * 1)   myenergi-api in der Instanz des Skripte-Adapters unter zustätzliche NPM-Module einzutragen. 
     * 
     * 2)   In diesem Script den Hub und den Zappi bekannt machen. Dazu die drei Konstanten 
     *       - hubSerialNo, 
     *       - zappiSerialNo 
     *       - hubApiKey 
     *      eintragen.
     *      Die Seriennummern findet man unter anderem unter https://myaccount.myenergi.com/  auf dem Tab "myenergi products"
     *      Dort muss auch ein API Key für den Hub generiert werden. 
     *      Dazu auf "Advanced" klicken, Key generieren und hier im Script eintragen.
     * 
     * 3)   ggfs die Konstante dataRoot anpassen. Dort werden die Datenpunkte beim ersten Start des Scripts erstellt.
     *      Sollte man einmal die Datenpunkte löschen einfach das Script erneut starten, dann werden neue oder fehlende Datenpunkte generiert.
     * 
     * 4)   optional: Die Konstante phaseInstallation auf 1 setzen, wenn man eine 1-Phaseninstallation hat.
     *      bei 3 Phasen werden 2 zusätzliche Datenpunkte mit den den Summen von CT1-3 und CT4-6 erstellt.
     *      Die Ladeleistung wird aber auch im Datenpunkt diversion, der Netzbezug/Einspeisung unter grid
     *      Im Normalfall sollten die CT1-3 die Ladeleistung der Wallbox und CT4-6 die Messwerte der externen CTs sein.
     *      Je nach Installation kann das aber anders sein.
     * 
     * 5)   optional: Die Konstante pollIntervall anpassen (default ist 5 Sekunden).
     *      
     * 6)   Im ioBroker unter Skripte ein neues JavaScript erstellen und den Inhalt dieses Scripts reinkopieren und laufen lassen
 
     * 7)   Sich hoffentlich freuen :)
     * 
     * 
     * BENUTZUNG AUF EIGENE GEFAHR - NUR FÜR ENTWICKLER
     * 
     * Changelog
     * **********
     * REL-1_00 
     *      - initiales Release
     * REL-1_01 03.06.22 
     *      - MinimumGreenLevel kann gesetzt werden (als unbestätigter Wert) 
     *      - Handling mit Commands angepasst, inkl Reset der CommandButtons auf false nach jedem Poll
     *      - neues dataRoot
     *      - divisor eingeführt (Volt wird durch 10 geteilt)
     */
        /**
         * Root der Datenpunkte, die erzeugt werden
         */
        const dataRoot = "0_userdata.0.myenergi.zappi";
        //const dataRoot = "javascript.0.zappi";
        
        /**
         * Seriennummer des Hubs
         */
        const hubSerialNo = 777888999; 
        
        /**
         * Seriennummer des Zappis
         */
        const zappiSerialNo = 12345;

        /**
         * Der im Myenergi-Portal erzeugte API-Key für den Hub.
         * (nicht das Login Passwort)
         */
        const hubApiKey = "xxx";
        
        /**
         * Anzahl der Phasen des Zappis, bei 3 Phasen werden zusätzliche Datenpunkte erzeugt mit den Summen der 3 Phasen
         */
        const phaseInstallation = 3;

        /**
         * Poll Intervall in dem die Werte abgerufen werden in Sekunden
         */
        const pollInterval = 5;

        /**
         * Der "Client" um auf die API Schnittstelle zuzugreifen 
         */
    
        var test = require('myenergi-api');
        const myenergi = new test.MyEnergi(hubSerialNo, hubApiKey);

        /**
         * Definition der Kommandopunkte
         */
        const ZappiCommands = {
            /**
             * Zappi Charge Mode
             * 
             *      1 = Fast
             *      2 = Eco
             *      3 = Eco+
             *      4 = Stopped
             */
            chargemodeFast: {
                id:   'fast',
                group: 'chargemode',
                name: 'sets chargemode FAST',
                type: 'boolean',
                role: "button",
                read: false,
                write: true
            },
            chargemodeEco: {
                id:   'eco',
                group: 'chargemode',
                name: 'sets chargemode ECO',
                type: 'boolean',
                role: "button",
                read: true,
                write: true
            },
            chargemodeEcoPlus: {
                id:   'ecoplus',
                group: 'chargemode',
                    name: 'sets chargemode ECO+',
                    type: 'boolean',
                    role: "button",
                    read: true,
                    write: true
            },
            chargemodesStop: {
                id:   'stop',
                group: 'chargemode',
                name: 'sets chargemode STOP',
                type: 'boolean',
                role: "button",
                read: true,
                write: true
            }               
        }

        /**
         * Definition der Datenpunkte
         * Es werden noch nicht alle möglichen Datenpunkte abgefragt. TBD
         */
        const ZappiValues = {
            sno: {
                apiId: 'sno',
                id:   'serialId',
                name: 'Seriennummer',
                type: 'string',
                readApi: true
            },
            dat: {
                apiId: 'dat',
                id:   'datum',
                name: 'Current Date',
                type: 'string',
                readApi: true
            },
            tim: {
                apiId: 'tim',
                id:   'zeit',
                name: 'Current Time',
                type: 'string',
                readApi: true
            },    
            ectp1: {
                apiId: 'ectp1',
                id:   'powerCt1',
                name: 'Physical CT connection 1 value Watts',
                type: 'number',
                unit: "W",
                readApi: true
            },
            ectp2: {
                apiId: 'ectp2',
                id:   'powerCt2',
                name: 'Physical CT connection 2 value Watts',
                type: 'number',
                unit: "W",
                readApi: true
            },
            ectp3: {
                apiId: 'ectp3',
                id:   'powerCt3',
                name: 'Physical CT connection 3 value Watts',
                type: 'number',
                unit: "W",
                readApi: true
            },
            ectp4: {
                apiId: 'ectp4',
                id:   'powerCt4',
                name: 'Physical CT connection 4 value Watts',
                type: 'number',
                unit: "W",
                readApi: true
            },
            ectp5: {
                apiId: 'ectp5',
                id:   'powerCt5',
                name: 'Physical CT connection 5 value Watts',
                type: 'number',
                unit: "W",
                readApi: true
            },
            ectp6: {
                apiId: 'ectp6',
                id:   'powerCt6',
                name: 'Physical CT connection 6 value Watts',
                type: 'number',
                unit: "W",
                readApi: true
            },
            dst: {
                apiId: 'dst',
                id:   'dst',
                name: 'Use Daylight Savings Time',
                type: 'number',
                readApi: true
            },
            frw: {
                apiId: 'frw',
                id:   'frequency',
                name: 'Supply Frequency',
                type: 'number',
                unit: "Hz",
                readApi: true
            },

            div: {
                apiId: 'div',
                id:   'diversion',
                name: 'Diversion amount Watts',
                type: 'number',
                unit: "W",
                readApi: true
            },
            gen: {
                apiId: 'gen',
                id:   'generated',
                name: 'Generated Watts',
                type: 'number',
                unit: "W",
                readApi: true
            },    
            grd: {
                apiId: 'grd',
                id:   'grid',
                name: 'Watts from grid (?)',
                type: 'number',
                unit: "W",
                readApi: true
            },
            fwv: {
                apiId: 'fwv',
                id:   'firmwareVersion',
                name: 'Firmware Version',
                type: 'string',
                readApi: true
            },
            mgl: {
                apiId: 'mgl',
                id:   'minimumGreenLevel',
                name: 'Minimum Green Level',
                type: 'number',
                unit: "%",
                readApi: true
            },
            pha: {
                apiId: 'pha',
                id:   'phases',
                name: 'Number of Phases in Installation ?',
                type: 'number',
                readApi: true
            },
            pri: {
                apiId: 'pri',
                id:   'priority',
                name: 'Priority',
                type: 'number',
                readApi: true
            },
            /**
             * Status
             *      1 = Paused,
             *      3 = Diverting/Charging,
             *      5 = Complete
             */
            sta: {
                apiId: 'sta',
                id:   'status',
                name: 'Status',
                type: 'number',
                readApi: true
            },
            staText: {
                apiId: 'sta',
                id:   'statusText',
                name: 'Status as Text',
                type: 'string',
                readApi: true,
                translate: true,
                translateMap: {
                    1:"Paused",
                    2:"undefined (2)",
                    3:"Diverting/Charging",
                    4:"undefined (4)",
                    5:"Complete",
                }            
            },        
            tz: {
                apiId: 'ts',
                id:   'timezone',
                name: 'Timezone (?)',
                type: 'number',
                readApi: true
            },
            vol: {
                apiId: 'vol',
                id:   'voltage',
                name: 'Voltage',
                type: 'number',
                divisor: 10,
                unit: "V",
                readApi: true
            },
            che: {
                apiId: 'che',
                id:   'lastCharge',
                name: 'Latest charge session. Charge added in kWh',
                type: 'number',
                unit: "kWh",
                readApi: true
            },
            /**
             * Lock Status
             * 
             *      4 bits
             *      1st digit - ?,
             *      2nd digit - 1 unlocked, 0 locked
             *   TBD
             */
            lck: {
                apiId: 'lck',
                id:   'lockState',
                name: 'Lock Status',
                type: 'number',
                readApi: true
            },
            /**
             * Charger Status
             * 
             *      A = EV Disconnected,
             *      B1 = EV Connected,
             *      B2 = Waiting for EV,
             *      C1 = EV Ready to Charge,
             *      C2 = Charging,
             *      F = Fault
             */
            pst: {
                apiId: 'pst',
                id:   'chargerState',
                name: 'Charger Status',
                type: 'string',
                readApi: true             
            },
            pstText: {
                apiId: 'pst',
                id:   'chargerStateText',
                name: 'Charger Status',
                type: 'string',
                readApi: true,
                translate: true,
                translateMap: {
                    "A":"EV Disconnected",
                    "B1":"EV Connected",
                    "B2":"Waiting for EV",
                    "C1":"EV Ready to Charge",
                    "C2":"Charging",
                    "F":"Fault"
                }            
            },        
        /**
             * Boost Mode. 
             *
             *      1 = ON
             *      0 = OFF
             *
             * @example
             * // Logic for selecting MANUAL or SMART
             * if (tbh !== undefined && bsm === 1) 
             *   MANUAL
             * else
             *   SMART
             */
                bsm: {
                apiId: 'bsm',
                id:   'boostModeManual',
                name: 'Boost Mode Manual',
                type: 'number',
                readApi: true
            },
                bst: {
                apiId: 'bst',
                id:   'boostModeTimer',
                name: 'Boost Mode Timer (?)',
                type: 'number',
                readApi: true
            },
                bss: {
                apiId: 'bss',
                id:   'boostModeSmart',
                name: 'Boost Mode Smart (?)',
                type: 'number',
                readApi: true
            },        


            /**
             * Zappi Charge Mode
             * 
             *      1 = Fast
             *      2 = Eco
             *      3 = Eco+
             *      4 = Stopped
             */
            zmo: {
                apiId: 'zmo',
                id:   'chargeMode',
                name: 'Zappi Charge Mode',
                type: 'number',
                readApi: true
            },
                    /**
             * Zappi Charge Mode
             * 
             *      1 = Fast
             *      2 = Eco
             *      3 = Eco+
             *      4 = Stopped
             */
            zmoText: {
                apiId: 'zmo',
                id:   'chargeModeText',
                name: 'Zappi Charge Mode as text',
                type: 'string',
                readApi: true,
                translate: true,
                translateMap: {
                    1:"FAST",
                    2:"ECO",
                    3:"ECOPLUS",
                    4:"STOP"
                }
            }
            

        }

        function createZappiDataPoints() {
            for (const [key,value] of Object.entries(ZappiValues)) {
                const objectName = dataRoot + "." + value.id;
                if ( !existsState(objectName )) {
                    console.log("Datenpunkt angelegt" + objectName);
                    createState(objectName, {
                        name: value.name,
                        type: value.type,
                        write: true,
                        role: (value.role?value.role:'value'),
                        unit: (value.unit?value.unit:'')
                    })
                }
            }
            if(phaseInstallation == 3)  {
                var objectName = dataRoot + ".PowerCtSumGroup1";
                if ( !existsState(objectName )) {
                    console.log("Datenpunkt angelegt" + objectName);
                    createState(objectName, {
                        name: "Sum CT 1-3",
                        type: "number",
                        write: true,
                        role: "value",
                        unit: "W"
                    })
                }
                objectName = dataRoot + ".PowerCtSumGroup2";
                        if ( !existsState(objectName )) {
                    console.log("Datenpunkt angelegt" + objectName);
                    createState(objectName, {
                        name: "Sum CT 4-6",
                        type: "number",
                        write: true,
                        role: "value",
                        unit: "W"
                    })
                }
            }
        }

    function createCommands(){
        const commandDataRoot = dataRoot+".commands";
        for (const [key,value] of Object.entries(ZappiCommands)) {
            const objectName = commandDataRoot+"."+value.group+"."+value.id;
            if ( !existsState(objectName )) {
                console.log("Command-Datenpunkt angelegt" + objectName);
                createState(objectName, {
                        type: value.type,
                        name: value.name,
                        role: value.role,
                        write: value.write,
                        read: value.read
                })
            }
        }
    }


    function updateDatapoints(statusZappi){
        //console.log("************* updating **********");
        //console.log(statusZappi);
        const statesMap = new Map(Object.entries(statusZappi));
        for (const [key,value] of Object.entries(ZappiValues)) {
            if(value.readApi) {
                const objectName = dataRoot + '.' + value.id;
                //console.log("aktualisiere: " + value.apiId + " - " + value.id);
                //console.log("aktueller Wert:" + convertValue(value, statesMap.get(value.apiId)));
                //console.log("Datenpunkt: " + objectName);
                const convertedValue = convertValue(value, statesMap.get(value.apiId));
                if(!(typeof value.translate === "undefined") != null && value.translate) {
                    //console.log(" Test " + objectName + " - " + findValueForKey(value.translateMap, convertedValue));
                    setState(objectName, findValueForKey(value.translateMap, convertedValue), true);
                } else {
                setState(objectName, convertedValue , true);
                }
            }
        }
        if(phaseInstallation == 3)  {
            var ectp1 = 0;
            var ectp2 = 0;
            var ectp3 = 0;
            var ectp4 = 0;
            var ectp5 = 0;
            var ectp6 = 0;
            if( !(typeof statusZappi.ectp1 === "undefined") ) {
                ectp1 = statusZappi.ectp1;
            }
            if( !(typeof statusZappi.ectp2 === "undefined") ) {
                ectp2 = statusZappi.ectp2;
            }
            if( !(typeof statusZappi.ectp3 === "undefined") ) {
                ectp3 = statusZappi.ectp3;
            }
            if( !(typeof statusZappi.ectp4 === "undefined") ) {
                ectp4 = statusZappi.ectp4;
            }
            if( !(typeof statusZappi.ectp5 === "undefined") ) {
                ectp5 = statusZappi.ectp5;
            }
            if( !(typeof statusZappi.ectp6 === "undefined") ) {
                ectp6 = statusZappi.ectp6;
            }

            setState(dataRoot+".PowerCtSumGroup1", (ectp1+ectp2+ectp3) , true);
            setState(dataRoot+".PowerCtSumGroup2", (ectp4+ectp5+ectp6) , true);
        }
        setState(dataRoot+'.commands.chargemode.eco'/*sets chargemode ECO*/, false , true);
        setState(dataRoot+'.commands.chargemode.ecoplus'/*sets chargemode ECOPLUS*/, false , true);
        setState(dataRoot+'.commands.chargemode.fast'/*sets chargemode FAST*/, false , true);
        setState(dataRoot+'.commands.chargemode.stop'/*sets chargemode STOP*/, false , true);


        //console.log("********* updating finished ******");
    }

    const convertValue = (tag, data) => {
        switch(tag.type) {
            case 'number':
            if(data == null) {
                return 0;
            }
            return parseFloat(data) / (tag.divisor?tag.divisor:1);

            case 'boolean':
                if (tag.bitnum) {
                    let mask = 1 << (tag.bitnum); // vorher tag.bitnum-1
                    // console.log("Convert: " + tag.name + " - " + ((parseInt(data) & mask) != 0));
                    return (parseInt(data) & mask) != 0
                }
                return data !== '0';

            case 'string':
                return "" + data;
        }

        return null
    }
    const run = (async () => {
        const zappiResponse =  JSON.stringify(await myenergi.getStatusZappi(zappiSerialNo));
            //console.log(zappiResponse);
            var statusZappi = JSON.parse(zappiResponse);
            updateDatapoints(statusZappi);
    });

    on({id: Array.prototype.slice.apply($("state[id="+ dataRoot +".commands.chargemode.*]")), change: "ne"}, async function (obj) {
        setState(obj.id, false , true);
        
        var modeApi = null;
        if(obj.id.endsWith("fast")) {
            modeApi = test.ZappiChargeMode.Fast;
        } else if (obj.id.endsWith("stop")) {
            modeApi = test.ZappiChargeMode.Off;
        } else if (obj.id.endsWith("eco")) {
            modeApi = test.ZappiChargeMode.Eco;
        } else if (obj.id.endsWith("ecoplus")) {
            modeApi = test.ZappiChargeMode.EcoPlus;
        }
        try {
            console.log("Setze ChargeMode " + modeApi);
            const resultJson = await myenergi.setZappiChargeMode(zappiSerialNo, modeApi);
            const result = JSON.parse(JSON.stringify(resultJson));
            if(!(result.status = 0)) {
                setState(obj.id, false , true);
            } else {
                console.log("Zappi ChargeMode konnte nicht gesetzt werden.");
            }
    
        } catch (e) {
            console.log(e);
        }
    });

    /**
     * Trigger für Minimum Green Level
     */
    on({id: [].concat([dataRoot + ".minimumGreenLevel"]), change: "ne", ack: false}, async function (obj) {
        var value = obj.state.val;
        var oldValue = obj.oldState.val;
        if(value < 0 || value > 100 ){
            console.error("Zappi MGL: " +value+ " konnte nicht gesetzt werden. Gültige Werte sind zwischen 0 und 100");
        } else{
            ;
            try {
                const resultJson = await myenergi.setZappiGreenLevel(zappiSerialNo, Math.round(value));
                //console.log(resultJson);
                const result = JSON.parse(JSON.stringify(resultJson));
                if(result.status == null || result.status == 0) {
                } else {
                    setState(obj.id, oldValue , true);
                    console.error("Zappi MGL: " +value+ " konnte nicht gesetzt werden. " + JSON.stringify(resultJson),);
                }
            } catch (e) {
                console.log(e);
            }
        }
    });

    /**
     * Sucht in einem Objekt nach dem Key und gibt das Objekt dazu zurück
     * returns null if not found
     */
    function findValueForKey(mapObject, key) {
        for (const [mapKey,mapValue] of Object.entries(mapObject)) {
            if (mapKey == key) {
                return mapValue;
            }
        };
        return null;
    }



    createZappiDataPoints();
    createCommands();
    wait(5000);
    schedule("*/"+pollInterval+" * * * * *", run);
