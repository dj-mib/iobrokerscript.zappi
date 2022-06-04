# iobroker.zappi
Script für den ioBroker um die myEnergi API für einen Zappi auszulesen

## Anleitung:

1)   myenergi-api in der Instanz des Skripte-Adapters unter zustätzliche NPM-Module einzutragen. 
2)   myenergi-zappi.js herunterladen
3)   In diesem Script den Hub und den Zappi bekannt machen. Dazu die drei Konstanten 
      - **hubSerialNo**, 
      - **zappiSerialNo** 
      - **hubApiKey** 
     eintragen.

     Die Seriennummern findet man unter anderem unter https://myaccount.myenergi.com/  auf dem Tab "myenergi products"
     Dort muss auch ein API Key für den Hub generiert werden. 
     Dazu auf "Advanced" klicken, Key generieren und hier im Script eintragen.
4)   ggfs die Konstante **dataRoot** anpassen. Dort werden die Datenpunkte beim ersten Start des Scripts erstellt.
     Sollte man einmal die Datenpunkte löschen einfach das Script erneut starten, dann werden neue oder fehlende Datenpunkte generiert.

5)   optional: Die Konstante **phaseInstallation** auf 1 setzen, wenn man eine 1-Phaseninstallation hat.
     bei 3 Phasen werden 2 zusätzliche Datenpunkte mit den den Summen von CT1-3 und CT4-6 erstellt.
     Die Ladeleistung wird aber auch im Datenpunkt diversion, der Netzbezug/Einspeisung unter grid
     Im Normalfall sollten die CT1-3 die Ladeleistung der Wallbox und CT4-6 die Messwerte der externen CTs sein.
     Je nach Installation kann das aber anders sein.

6)   optional: Die Konstante **pollIntervall** anpassen (default ist 5 Sekunden).
7)   Im ioBroker unter Skripte ein neues JavaScript erstellen und den Inhalt desc Scripts einfügen und laufen lassen
8)   Sich hoffentlich freuen :)

#### Chargemode Steuern:

Wird einer der Datenpunkte auf true gesetzt wird der gewünschte Chargemode an die Wallbox übermittelt und nach einiger Zeit im Datenpunkt chargeMode bzw. chargeModeText angezeigt.
*.myenergi.zappi.commands.chargemode.eco
*.myenergi.zappi.commands.chargemode.ecoplus
*.myenergi.zappi.commands.chargemode.fast
*.myenergi.zappi.commands.chargemode.stop 

#### Minimum Green Level steuern:

Den Datenpunkt minimumGreenLevel mit einem unbestätigten Wert zwischen 0 und 100 aktualisieren. 
