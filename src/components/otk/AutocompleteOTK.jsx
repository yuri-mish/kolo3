import { Popup, ScrollView} from "devextreme-react";
import {TextBox, Button as TextBoxButton } from 'devextreme-react/text-box';
import React, { useEffect, useRef, useState } from "react";
import { DataGrid } from "devextreme-react";
import { Position } from "devextreme-react/popup";

export const AutocompleteOTK = (props) => {
  const dataSource = props.dataSource;
  if (props.dataSourceUserOptions)
    dataSource.userOptions = props.dataSourceUserOptions;

  const searchField = props.searchField || "name";
  const keyField = props.keyField || "ref";

  const ref = useRef();
  const textBoxRef = useRef();
  const [value, setValue] = useState(props.value);
  const [row, setRow] = useState(undefined);
  const [rowIndex, setRowIndex] = useState(undefined);
  const [result, setResult] = useState();
  const [gridVisible, setGridVisible] = useState(false);

  const changeValue = (e) => {
    setGridVisible(true);
    setValue(e.event.target.value);
    setRowIndex(undefined);
    if (ref && ref.current) ref.current.instance.clearSelection();
  };

  useEffect(() => {
    setGridVisible(false);
    if (ref.current && props.onChange) {
      const r = ref.current.instance.getSelectedRowsData()[0];
      props.onChange(r);
    }
  }, [props, result]);

  useEffect(() => {
    setTimeout(function () {
      if (textBoxRef && textBoxRef.current) textBoxRef.current.instance.focus();
    }, 500);
  }, [gridVisible]);

  useEffect(() => {
    if (ref && ref.current && ref.current.instance)
      ref.current.instance.filter([searchField, "contains", value]);
    return () => {};
  }, [searchField, value]);

  const rowClick = (e) => {
    setValue(e.data[searchField]);
    setResult(e.key);
  };
  const renderContent = () => {
    return (
      <ScrollView width="100%" height="100%" >
        <DataGrid
          ref={ref}
          dataSource={dataSource}
          paging={false}
          selection={{ mode: "single" }}
          columns={props.columns || [searchField]}
          onRowClick={rowClick}
        />
      </ScrollView>
    );
  };
  const enterKey = (e) => {
    let _rowIndex = undefined;
    switch (e.event.code) {
      case "ArrowDown": {
        if (!gridVisible) setGridVisible(true);
        _rowIndex =
          rowIndex >= 0
            ? Math.min(rowIndex + 1, ref.current.instance.totalCount() - 1)
            : 0;
        break;
      }
      case "ArrowUp": {
        _rowIndex = rowIndex > 0 ? Math.max(rowIndex - 1, 0) : 0;
        break;
      }
      case "Enter": {
        if (row) {
          const r = row[0];
          setValue(r[searchField]);
          setResult(r[keyField]);
        } else if (ref.current && ref.current.instance.totalCount() === 1) {
          ref.current.instance.selectRowsByIndexes(0);
          const r = ref.current.instance.getSelectedRowsData()[0];
          if (r) {
            setValue(r[searchField]);
            setResult(r[keyField]);
          }
        }
        e.event.preventDefault();
        break;
      }
      default: {
      }
    }
    if (gridVisible && _rowIndex !== undefined) {
      ref.current.instance.selectRowsByIndexes(_rowIndex);
      setRowIndex(_rowIndex);
      setRow(ref.current.instance.getSelectedRowsData());
      e.event.preventDefault();
    }
  };
  return (
    <React.Fragment>
      <TextBox
        ref={textBoxRef}
        id="tgrt"
        onInput={changeValue}
        onKeyDown={enterKey}
        value={value}>
          <TextBoxButton
                  name='aaa'
                  location="after"
                  type = 'default'
                  options={{
                    icon: 'spindown',
                    onClick:() => {
                      setGridVisible(!gridVisible)
                    }
                  }}
                                  />
        </TextBox>
      <Popup
        height={300}
        visible={gridVisible}
        showTitle={props.showTitle || false}
        contentRender={renderContent}
        shading={false}>
        <Position my="left top" at="left bottom" of="#tgrt" />
      </Popup>
    </React.Fragment>
  );
};
