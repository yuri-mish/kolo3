import React, { useEffect, useState } from "react";
import { Form, Menu, TextArea } from "devextreme-react";
import { useHistory } from "react-router-dom";
import { partnerDataSource } from "./../db/ds/dsPartners";
import {
  GroupItem,
  ButtonItem,
  ButtonOptions,
  Label,
  SimpleItem,
} from "devextreme-react/form";
import {
  // Validator,
  // RequiredRule,
  // CompareRule,
  // EmailRule,
  // PatternRule,
  // StringLengthRule,
  // RangeRule,
  AsyncRule,
  // CustomRule,
} from "devextreme-react/form";
import { API_HOST } from "./../constants";
import { LoadPanel } from "devextreme-react/load-panel";
import { convertToText, showError, showSuccess } from "../utils/filtfunc";



var _ = require("lodash");

export const Partner = (props) => {
  const history = useHistory();

  
  const setP =  (id) => {
    partnerDataSource.byKey(id).then(data => {setPartner(data)})
  };

  const [partner, setPartner] = useState({});
  const [loadPanelVisible, setloadPanelVisible] = useState(false);

  const handleOpenDataBot = async (e) => {
    const dat = await asyncRule({ value: partner.edrpou });
    if (!dat) {
      showError("Неправильний код ЄДРПОУ");
      return;
    }
    const d = await partnerDataSource.byEdrpou("" + partner.edrpou);
    if (d) {
      setPartner(d);
      showSuccess("Знайдено у базі");
      return 0;
    }
    showSuccess("Пошук в OpenDataBot");

    setloadPanelVisible(true);

    const findVal = (obj, key) => {
      var seen = new Set(),
        active = [obj];
      while (active.length) {
        var new_active = [],
          found = [];
        for (var i = 0; i < active.length; i++) {
          // eslint-disable-next-line no-loop-func
          Object.keys(active[i]).forEach((k) => {
            var x = active[i][k];
            if (k === key) {
              found.push(x);
            } else if (x && typeof x === "object" && !seen.has(x)) {
              seen.add(x);
              new_active.push(x);
            }
          });
        }
        if (found.length) return found;
        active = new_active;
      }
      return null;
    };

    fetch(API_HOST, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        query: `{opendatabot(kod:"${partner.edrpou}")}`,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setloadPanelVisible(false);
        if (data.data.opendatabot && data.data.opendatabot.full_name) {
          const botPartner = data.data.opendatabot;
          const inn = findVal(botPartner, "pdv");

          setPartner((prevState) => ({
            ...prevState,
            name: botPartner.short_name,
            name_full: botPartner.full_name,
            is_buyer: true,
            individual_legal: "ЮрЛицо",
            inn: inn ? inn[0].number : "",
            note: !prevState.note ? JSON.stringify(botPartner) : prevState.note,
          }));
          return;
        } else {
          showError("Не знайдено!!!");
          setPartner({ edrpou: partner.edrpou });
        }
      });
  };

  useEffect(() => {
    if (props._id && typeof props._id === "object" && props._id !== null) {
      //setPartner(props._id); 
      setP(props._id.ref);
     
    } else if (props._id){
      setP(props._id);
    }
  }, [props._id]);

  const noteRender = (data) => {
    return (
      <TextArea
        spellcheck={false}
        value={partner && partner.note ? partner.note : ""}
        onValueChanged={(nValue) =>
          setPartner((prevState) => ({
            ...prevState,
            note: nValue,
          }))
        }
      />
    );
  };

  const position = { of: "#form" };

  const asyncRule = (value) => {
    return new Promise((resolve) => {
      resolve([8, 10].includes(value.value.length));
    });
  };

  return (
    <div>
      <LoadPanel
        shadingColor="rgba(0,0,0,0.4)"
        position={position}
        message="Завантаження..."
        onHiding={setloadPanelVisible}
        visible={loadPanelVisible}
        showIndicator={true}
        shading={true}
        showPane={true}
      />
      <Menu
        onItemClick={async (e) => {
          switch (e.itemData.id) {
            case "save": {
              var doctosave = _.cloneDeep(partner);
              var ref = doctosave.ref;
              if (!doctosave._id) {
                doctosave._id = "cat.partners|" + ref;
                doctosave.class_name = "cat.partners";
              }
              if (doctosave.ref) delete doctosave.ref;
              const q = JSON.stringify({
                query: `mutation{setPartner(input:${convertToText(
                  doctosave
                )}){_id}}`,
              });
              const datar = await fetch(API_HOST, {
                method: "POST",
                credentials: "include",
                body: q,
                headers: { "Content-Type": "application/json" },
              }).then(resp=>(resp.json())) ;
              if (datar.errors)
                datar.errors.forEach((err) => {
                  let message = '<невідомо>'
                  if  (err&&err.message)  message = err.message
                  showError("Помилка запису: " + message);
                });
              else showSuccess("Записано");
              break;
            }
            case "close": {
              history.goBack();
              break;
            }
            default: {
            }
          }
        }}
        dataSource={[
          {
            text: "Зберегти",
            id: "save",
          },
          {
            text: "Закрити",
            id: "close",
          },
        ]}></Menu>
      <Form
        id="form"
        formData={partner}
        //readOnly={readOnly}
        showColonAfterLabel={true}
        labelLocation={"left"}
        width={1000}>
        <GroupItem colCount={4}>
          <SimpleItem dataField="id" editorOptions={{ disabled: false }}>
            <Label text="Код" />
          </SimpleItem>
          <GroupItem colSpan={2}>
            <SimpleItem
              dataField="edrpou"
              editorType="dxTextBox"
              activeStateEnabled={true}
              editorOptions={{ disabled: false }}>
              <Label text="Код ЄДРПОУ" />
              <AsyncRule
                message="Неправильний код"
                validationCallback={asyncRule}
              />
            </SimpleItem>
          </GroupItem>
          <ButtonItem horizontalAlignment="left">
            <ButtonOptions
              text="Знайти"
              type="success"
              disabled={false}
              onClick={handleOpenDataBot}
            />
          </ButtonItem>
        </GroupItem>
        <GroupItem colCount={4}>
          <SimpleItem
            colSpan={3}
            dataField="name"
            editorOptions={{ disabled: false }}>
            <Label text="Найменування" />
          </SimpleItem>
          <SimpleItem
            colSpan={1}
            visible={false}
            classname="cb"
            editorType="dxCheckBox"
            dataField="is_buyer"
            editorOptions={{ disabled: false }}>
            <Label text="Покупець" />
          </SimpleItem>
        </GroupItem>
        <GroupItem colCount={4}>
          <SimpleItem
            colSpan={3}
            dataField="name_full"
            editorOptions={{ disabled: false }}>
            <Label text="Найменування повне" />
          </SimpleItem>
          <SimpleItem
            colSpan={1}
            visible={false}
            editorType="dxCheckBox"
            dataField="is_supplier"
            editorOptions={{ disabled: false }}>
            <Label text="Постачальник" />
          </SimpleItem>
        </GroupItem>
        <GroupItem colCount={4}>
          <SimpleItem
            colSpan={2}
            editorType="dxSelectBox"
            dataField="individual_legal"
            editorOptions={{ disabled: false, items: ["ЮрЛицо", "ФизЛицо"] }}>
            <Label text="Форма" />
          </SimpleItem>
          <SimpleItem
            colSpan={1}
            dataField="inn"
            editorOptions={{ disabled: false, mask: "999999999999" }}>
            <Label text="ИНН" />
          </SimpleItem>
        </GroupItem>
        <SimpleItem
          colSpan={2}
          dataField="note"
          render={noteRender}
          editorOptions={{ disabled: false }}>
          <Label text="Коментар" />
        </SimpleItem>
      </Form>
    </div>
  );
};
