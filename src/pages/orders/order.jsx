import React, { useMemo } from "react";
import { useEffect } from "react";
import { useState } from "react";
import { TextBox, DateBox, Menu } from "devextreme-react";
import Toolbar, { Item } from "devextreme-react/toolbar";
import { locale } from "devextreme/localization";
import moment from "moment";
import DataGrid, {
  Column,
  Editing,
  Texts,
  Lookup,
} from "devextreme-react/data-grid";
import { v4 as uuid_v4 } from "uuid";

import { PartnerBox } from "../../db/ds/dsPartners";
import { nomsDataSource } from "../../db/ds/dsNoms";
import { useParams } from "react-router-dom";
import { useHistory } from "react-router-dom";
import { convertToText, showError } from "../../utils/filtfunc";
//import { API_HOST, uaFilterRowText } from "./../../constants";
import { API_HOST } from "./../../constants";
import { AutocompleteOTK } from "../../components/otk/AutocompleteOTK";
import { dsBuyersOrders } from "./../../db/ds/dsOrders";

var _ = require("lodash");

export const Order = () => {
  const history = useHistory();

  var rowData = {};

  let { id } = useParams();

  const OrderSchema = useMemo(
    () => ({
      date: moment(Date.now()).format("YYYY-MM-DDTHH:mm:ss"),
      number_doc: "",
      class_name: "doc.buyers_order",
      partner: { ref: "", name: "" },
      services: [{ nom: { row: 1, ref: "", name: "" }, price: 0 }],
      doc_amount: 0,
      vat_included: true,
      doc_currency: "",
    }),
    []
  );

  const [data, setData] = useState(OrderSchema);
  const [prices, setPrices] = useState();

  const load = () => {
    dsBuyersOrders.byKey(id)
    .then(response => {
      if (response && response.ref !== "") {
        loadPrices(response.date)
          .then(prices => {
            response.services.forEach((r) => {
              r.price = prices.find((p) => p.nom === r.nom.ref)?.price || 0;
              const calcPrice = Math.round(r.amount / r.quantity, -2);
              r.nats = r.spec = 0;
              if (calcPrice > r.price) r.nats = calcPrice - r.price;
              if (calcPrice < r.price && r.discount_percent_automatic === 0)
                r.spec = calcPrice;
            });
            setData(response);
          })
          .catch(() => {
            showError("Помилка заванатаження цін");
          });
      } else {
        loadPrices();
      }
    });
  };

  const loadPrices = date => {
    if (!date) date = moment(Date.now()).format("YYYY-MM-DDTHH:mm:ss");
    return fetch(API_HOST, {
      method:       "POST",
      credentials:  "include",
      body: JSON.stringify({
        query:      `{prices (date:"${date}") { nom price currency vat_included }}`,
      }),
      headers:    {"Content-Type": "application/json"},
    }).then(resp => resp.json())
      .then(resp => {
        //        console.log("=prices response:", data);
        var pr = [];
        if (resp.data.prices && resp.data.prices.length > 0) {
          pr = resp.data.prices;
          setData(prevState => ({...prevState,
            vat_included: pr[0].vat_included === "true",
            doc_currency: pr[0].currency,
          }));
        }
        setPrices(pr);
        return pr;
      });
  };

  useEffect(() => {
    if (id && id !== "new") {
      load();
    } else loadPrices();
    nomsDataSource.userOptions.selectServices = true;
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  locale("ua"); //!!!!+++

  const onQuantityChanged = (r) => {
    calcrRow(rowData);
  };

  const calcrRow = (currentRowData) => {
    var doc_amount = 0;
    if (!currentRowData.quantity) currentRowData.quantity = 1;
    const pr = currentRowData.spec
      ? currentRowData.spec
      : currentRowData.price + (currentRowData.nats ? currentRowData.nats : 0);
    currentRowData.amount = pr * currentRowData.quantity;
    if (isNaN(currentRowData.amount)) currentRowData.amount = 0;
    if (currentRowData.vat_rate === "НДС20")
      currentRowData.vat_amount = Math.round(currentRowData.amount / 6, -2);
    else currentRowData.vat_amount = 0;
    data.services.forEach((r) => {
      doc_amount +=
        r.row === currentRowData.row ? currentRowData.amount : r.amount;
    });
    setData((prevState) => ({
      ...prevState,
      doc_amount: doc_amount,
      services: prevState.services.map((row) =>
        row.row === currentRowData.row ? currentRowData : row
      ),
    }));
  };
  const onchangeNom = async (newData, value, currentRowData) => {
    currentRowData.price = prices.find((r) => r.nom === value).price || 0;
    var res = await nomsDataSource.byKey(value);
    if (res) {
      currentRowData.content = res.name_full;
      if (res.vat_rate) currentRowData.vat_rate = res.vat_rate;
    }
    currentRowData.nom.ref = value;
    currentRowData.amount = 0;
    calcrRow(currentRowData);
  };

  const onchangeDate = (param) => {
    setData((prevState) => ({
      ...prevState,
      date: moment(param.value).format("YYYY-MM-DDTHH:mm:ss"),
    }));

    loadPrices(moment(param.value).format("YYYY-MM-DDTHH:mm:ss"))
      .then((prices) => {
        data.services.forEach((row) => {
          var pricerow = prices.find(
            priceRow => priceRow.nom === row.nom.ref
          );
          row.price = pricerow ? pricerow.price : 0;
          calcrRow(row);
        });
      })
      .catch(() => {
        showError("Помилка завантаження прайсів");
      });
  };

  const addButtonOptions = {
    icon: "plus",
    onClick: () => {
      var st = data.services.slice();
      // console.log("New row:", st);
      st.push({
        row: data.services.length + 1,
        nom: { ref: undefined, name: "" },
      });
      setData(prevState => ({...prevState,services: st}));
    },
  };

  const cellTemplate = r => {
    return (
      <AutocompleteOTK
        value={r.data.text}
        searchField="name"
        keyField="ref"
        dataSource={nomsDataSource}
        dataSourceUserOptions={{ selectServices: true }}
        columns={[
          { dataField: "name", width: "80", caption: "Назва" },
          { dataField: "name_full", caption: "Повна назва" },
        ]}
        onChange={e => {
          if (e) {
            const services = data.services.slice();
            services[r.data.rowIndex].nom.ref = e.ref||'';
            services[r.data.rowIndex].nom.name = e.name||'';
            r.data.setValue(e.ref||'', e.name||'');
            setData(prevState => ({...prevState,services: services}));
          }
        }}
      />
    );
  };

  const changeReq = e => {
    setData(prevState => ({
      ...prevState,
      [e.element.id]: e.event.target.value,
    }));
  };

  const formValidation = () => {
    let isValid = true;
    let errorMessage = "";
    if (!data.partner || !data.partner.ref) {
      isValid = false;
      errorMessage += "Помилка: Не заповнено реквізит Контрагент\r\n";
    }
    if (data.services.length === 0) {
      isValid = false;
      errorMessage += "Помилка: Таблична частина порожня\r\n";
    }

    data.services.forEach(r => {
      if (!r.nom || !r.nom.ref) {
        isValid = false;
        errorMessage += `Помилка: (рядок №${r.row}) - не заповнена послуга\r\n`;
      }
      if (r.quantity < 1) {
        isValid = false;
        errorMessage += `Помилка: (рядок №${r.row}) - невірна кількість\r\n`;
      }
    });
    if (!isValid) showError(errorMessage);
    return isValid;
  };

  return (
    <div>
      <Menu
        onItemClick={async e => {
          switch (e.itemData.id) {
            case "ok": {
              if (!formValidation()) return;
              const doctosave = _.cloneDeep(data);
              if (id === "new") {
                doctosave._id = "doc.buyers_order|" + uuid_v4();
                doctosave.class_name = "doc.buyers_order";
              }
              doctosave.partner = doctosave.partner.ref;
              if (doctosave.organization)
                doctosave.organization = doctosave.organization.ref;
              if (doctosave.responsible) delete doctosave.responsible;
              if (doctosave.number_doc) delete doctosave.number_doc;

              doctosave.services.forEach((r) => {
                if (r.spec) delete r.spec;
                if (r.nats) delete r.spec;
                return (r.nom = r.nom.ref);
              });
              const q = JSON.stringify({
                query: `mutation{setBuyersOrder(input:${convertToText(
                  doctosave
                )}) {_id}}`,
              });

              const response = await fetch(API_HOST, {
                method: "POST",
                credentials: "include",
                body: q,
                headers: {
                  "Content-Type": "application/json",
                },
              });
              // console.log(response);
              const datar = await response.json();
              // console.log(datar);
              if (datar.errors) {
                datar.errors.forEach((err) => {
                  showError("Помилка запису: " + err.message);
                });
              } else {
                history.goBack();
              }
              break;
            }
            case "close": {
              history.goBack();
              break;
            }
            case "print": {
              var windowObjectReference = null;
              var winParam = ""; // `width=${window.screen.width*8/10},left=${window.screen.width/10}`
              windowObjectReference = window.open(
                e.itemData.url,
                "printwin",
                winParam
              );
              windowObjectReference.focus();
              break;
            }
            default: {
            }
          }
        }}
        dataSource={[
          {
            id: "ok",
            text: "Закрити і зберегти",
            icon: "save",
          },
          { id: "close", text: "Закрити", icon: "close" },
          {
            text: "Зберегти",
            disabled: true,
          },
          {
            text: "Друк",
            icon: "print",
            items: [
              {
                id: "print",
                text: "Рахунок",
                url: API_HOST + `/printform/${id}/inv`,
                disabled: !data.number_doc,
              },
              {
                id: "print",
                text: "Договір",
                url: API_HOST + `/printform/${id}/dog`,
                disabled: !data.number_doc,
              },
              {
                id: "print",
                text: "Договір сертифікації",
                url: API_HOST + `/printform/${id}/dogs`,
                disabled: false, //!data.number_doc,
              },
              {
                id: "print",
                text: "Договір для Казначейства",
                url: API_HOST + `/printform/${id}/dogk`,
                disabled: !data.number_doc,
              },
            ],
          },
        ]}></Menu>
      <div style={{ display: "flex" }}>
        <div style={{ display: "flex", paddingRight: "1rem" }}>
          <div style={{ width: "150px" }} class="dx-field-label">
            Номер
          </div>
          <TextBox
            value={data.number_doc}
            readOnly={true}
            placeholder="...номер документа..."
            hint="номер документу присвоєний головним офісом"
            width={250}
          />
          <div style={{ width: "150px" }} class="dx-field-label">
            Дата
          </div>
          <DateBox
            value={data.date}
            id="date"
            type="datetime"
            displayFormat={"dd-MM-yyyy HH:mm:ss"}
            useMaskBehavior={true}
            onValueChanged={onchangeDate}
            hint="дата документу"
            width={350}
          />
        </div>
      </div>

      <div style={{ display: "flex", paddingTop: "1rem" }}>
        <div style={{ width: "150px" }} class="dx-field-label">
          Контрагент
        </div>

        <PartnerBox
          value={data.partner?.ref}
          onChange={e => {
            setData(prevState => ({
              ...prevState,
              partner: {
                ref: e.ref || '',
                name: e.name || '',
              },
            }));
          }}
        />
      </div>
      <div style={{ display: "flex" }}>
        <div style={{ width: "150px" }} class="dx-field-label">
          Особа
        </div>
        <TextBox
          width="80%"
          id="ClientPerson"
          value={data.ClientPerson}
          placeholder="...контактана особа..."
          onChange={changeReq}
        />
        <div style={{ display: "flex", paddingRight: "1rem" }}>
          <div style={{ width: "150px" }} class="dx-field-label">
            Телефон
          </div>
          <TextBox
            id="ClientPersonPhone"
            value={data.ClientPersonPhone}
            placeholder="... номер телефону ..."
            onChange={changeReq}
          />
        </div>
      </div>

      <div style={{ paddingTop: "1rem" }}>
        <Toolbar>
          <Item
            location="before"
            locateInMenu="auto"
            widget="dxButton"
            options={addButtonOptions}
          />

          <Item text="Add" locateInMenu="always" />
        </Toolbar>
        <DataGrid
          noDataText="Список порожній"
          remoteOperations={false}
          rowAlternationEnabled={true}
          showBorders={true}
          showColumnLines={true}
          allowColumnResizing={true}
          columnResizingMode="widget"
          dataSource={data.services}
          hoverStateEnabled={true}
          selectTextOnEditStart={true}
          onInitNewRow={(e) => {
            var st = data.services.slice();
            st.push({
              row: data.services.length + 1,
              nom: { ref: undefined, name: "" },
            });
            setData(prevState => ({
              ...prevState,
              services: st,
            }));
          }}
          onEditorPrepared={e => {
            rowData = e.row.data;
            if (e.dataField === "quantity") {
              e.editorElement.onchange = onQuantityChanged;
            }
          }}
          onRowRemoved={e => {
            var st = data.services.filter(row => row.row !== e.data.row);
            var i = 1;
            st.forEach(r => r.row = i++);
            setData(prevState => ({...prevState,services: st}));
          }}>
          <Editing
            mode="cell"
            allowUpdating={true}
            allowDeleting={true}
            useIcons={true}
            confirmDelete={false}>
            <Texts confirmDeleteMessage="Вилучити?" deleteRow="вилучити" />
          </Editing>
          <Column
            dataField="nom.ref"
            caption="Номенклатура"
            calculateDisplayValue={data => {
              return data.nom?.name;
            }}
            setCellValue={onchangeNom}
            editCellComponent={cellTemplate}
            placeholder="...вкажіть послугу..">
            <Lookup
              dataSource={nomsDataSource}
              displayExpr="name"
              valueExpr="ref">
              <DataGrid dataSource={nomsDataSource} />
            </Lookup>
          </Column>
          <Column  dataField="price"
            caption="Ціна"
            allowEditing={false}
            width={100}
            headerCellRender={(data) => {
              return (
                <p className="aaa" style={{ "text-align": "center" }}>
                  Ціна <br /> (прайс)
                </p>
              );
            }}
          />
          <Column dataField="quantity"
            caption="Кількість"
            width={80}
            allowEditing={true}
          />
          <Column dataField="spec"
            caption="СпецЦіна"
            allowEditing={false}
            width={100}
          />
          <Column dataField="discount_percent_automatic"
            caption="%скидки"
            allowEditing={false}
            width={80}
          />
          <Column dataField="nats"
            caption="Націнка"
            value={100}
            allowEditing={false}
            width={80}
          />{" "}
          {/* calculateCellValue={calcNats} */}
          <Column  dataField="amount"
            caption="Сума"
            allowEditing={false}
            width={100}
          />
          <Column
            dataField="gos_code"
            caption="Держ.номер"
            allowEditing={true}
          />
          <Column dataField="vin_code" caption="VIN код" allowEditing={true} />
        </DataGrid>
      </div>
      <div
        style={{
          display: "flex",
          paddingTop: "1rem",
          paddingRight: "1rem",
          width: "800",
        }}>
        <div style={{ width: "150px" }} class="dx-field-label">
          Коментар
        </div>
        <TextBox
          value={data.note}
          width="100%"
          id="note"
          placeholder="коментар"
          onChange={changeReq}
        />
      </div>
    </div>
  );
};
