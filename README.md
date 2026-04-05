# Eshop

Šī ir internetveikala sistēma ar publisko produktu lapu un admin paneli.

## Funkcionalitāte

Internetveikalā ir iespējams:
- apskatīt produktu sarakstu,
- sinhronizēt visus produktus no noliktavas sistēmas,
- atjaunot konkrēta produkta atlikumu,
- dzēst visus produktus no internetveikala datubāzes,
- rezervēt preci,
- atcelt rezervāciju.

Publiskajā lapā lietotājs redz produktus no internetveikala datubāzes, nevis pa tiešo no noliktavas sistēmas.

## Datu iegūšana

Internetveikals izmanto noliktavas sistēmas API:

- `GET /api/products`
- `GET /api/products/:id/stock`

Saņemtie dati tiek saglabāti internetveikala datubāzē ar `INSERT` vai `UPDATE`.

Tas ļauj internetveikalam darboties neatkarīgi no noliktavas sistēmas pieejamības.

## Rezervācija

Rezervācija tiek veikta ar `POST` metodi.

Rezervējot preci:
- samazinās pieejamais atlikums,
- palielinās rezervētais daudzums,
- tiek izveidots rezervācijas ieraksts.

Ir iespējams arī:
- atcelt rezervāciju,
- atgriezt atlikumu atpakaļ,
- notīrīt atceltās rezervācijas no saraksta.

## Izmantotās tehnoloģijas

- Node.js
- Express.js
- PostgreSQL
- EJS
- CSS
- Render

## Datubāze

Internetveikals izmanto tabulas:

- `eshop_products`
- `reservations`

## Mērķis

Šīs sistēmas mērķis ir attēlot produktus lietotājam, izmantojot savā datubāzē saglabātus datus, kas sinhronizēti no noliktavas sistēmas API.