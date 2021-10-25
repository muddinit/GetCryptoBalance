let tableData = [];

function Timestamp() {
    let x = new Date();
    return x.getHours() + ":" + x.getMinutes() + ":" + x.getSeconds() + " ";
}

function PutExample() {
    $(addressInput).val(Object.values(example).join("\n"));
    $(log).prepend(`<br>${Timestamp()} Загружен пример`);
}

// Сохранение .csv файла
function Save() {
    let file = [];
    file.push(dataTable1.settings().init().columns.map(a => a.title));
    dataTable1.data().toArray().forEach(element => file.push(Object.values(element)));
    file = file.join("\r\n");
    file = new Blob([(file)], { type: "text/csv" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = "balance";
    a.click();
    URL.revokeObjectURL(a.href);
}

//Вызов определенного API в зависимости от валюты
async function OutputBalance(currency, currencyName, url, address) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await axios.get(url)
        .then(response => {
            switch (currency) {
                case 'DOGE':
                case 'DASH':
                case 'LTC':
                case 'BTC': {
                    balance = response.data.final_balance / 100000000;
                    break;
                }
                case 'ETH': {
                    balance = response.data.ETH.balance;
                    break;
                }
            }
            $(log).prepend(`<br>${Timestamp()} ${currencyName} Адрес. Баланс равен ${balance} ${currency}`);
            tableData.push({ name: currencyName, balance: balance, currency: currency, address: address });
            return true;
        })
        .catch((error) => {
            if (error.response) {
                $(log).prepend(`<br>${Timestamp()} Ошибка ${error.response.status}`);
            }
        });
}

async function GetBalanceData() {

    if ($(addressInput).val() == "") {
        $(log).prepend(`<br>${Timestamp()} Нет информации о адресах`);
        return false;
    }

    // Отключаем кнопки
    $("#savebutton").prop('disabled', true);
    $("#exampleButton").prop('disabled', true);
    $("#updateButton").prop('disabled', true);

    //Убираем таблицу если она есть
    if ($.fn.DataTable.isDataTable('#balanceTable')) {
        $('#balanceTable').DataTable().clear().destroy();
        $('#balanceTable').remove();
    }

    let datatable1;
    $(log).empty();
    let addressValues = $(addressInput).val().split(/\r?\n/);
    for (let element of addressValues) {

        //Bitcoin
        if (element.length >= 26 || element.length <= 35) {
            if (element.startsWith('1') || element.startsWith('3') || element.startsWith('bc1')) {
                await OutputBalance('BTC', 'Bitcoin', `https://api.blockcypher.com/v1/btc/main/addrs/${element}/balance`, element);
            }
        }

        // Dogecoin
        if (element.startsWith('D') && (element[1] === element[1].toUpperCase())) {
            await OutputBalance('DOGE', 'Dogecoin', `https://api.blockcypher.com/v1/doge/main/addrs/${element}/balance`, element);
        }

        //Litecoin
        else if (element.startsWith('L') || element.startsWith('M') || element.startsWith('ltc')) {
            await OutputBalance('LTC', 'Litecoin', `https://api.blockcypher.com/v1/ltc/main/addrs/${element}/balance`, element);
        }

        //Dashcoin
        else if (element.startsWith('X')) {
            await OutputBalance('DASH', 'Dashcoin', `https://api.blockcypher.com/v1/dash/main/addrs/${element}/balance`, element);
        }

        //Ethereum
        else if (element.startsWith('0x') && element.length === 42) {
            await OutputBalance('ETH', 'Ethereum', `https://api.ethplorer.io/getAddressInfo/${element}?apiKey=freekey`, element);
        }

    }

    // Создаем таблицу
    if (tableData.length !== 0) {
        dataTable1 = $('#balanceTable').DataTable(
            {
                dom: 'frt',
                responsive: true,
                destroy: true,
                "pageLength": tableData.length + 1,
                data: tableData,
                columns: [
                    { title: "Вид валюты", data: "name" },
                    { title: "Адрес", data: "address" },
                    { title: "Баланс", data: "balance" },
                    { title: "Валюта", data: "currency" }
                ]
            }
        );
    } else {
        $("#exampleButton").prop('disabled', false);
        $("#updateButton").prop('disabled', false);
        return false;
    }

    $("#savebutton").prop('disabled', false);
    $("#exampleButton").prop('disabled', false);
    $("#updateButton").prop('disabled', false);
    tableData = [];
    return true;
}