declare var PCore;

export const TABLE_CELL = "SdkRenderer";
export const DELETE_ICON = "DeleteIcon";

// BUG-615253: Workaround for autosize in table with lazy loading components
/* istanbul ignore next */
function getFiledWidth(field, label) {
  let width;
  switch (field.type) {
    case "Time":
      width = 150;
      break;
    case "Date":
      width = 160;
      break;
    case "DateTime":
      width = 205;
      break;
    case "AutoComplete":
    case "TextArea":
      width = 190;
      break;
    case "Currency":
    case "TextInput":
      width = 182;
      break;
    case "Checkbox":
       
      // eslint-disable-next-line no-case-declarations
      const text = document.createElement("span");
      document.body.appendChild(text);
      text.style.fontSize = "13px";
      text.style.position = "absolute";
      text.innerHTML = label;
      width = Math.ceil(text.clientWidth) + 30;
      document.body.removeChild(text);
      break;
    default:
      width = 180;
  }
  return width;
}

export const getContext = (thePConn) => {
  const contextName = thePConn.getContextName();
  const pageReference = thePConn.getPageReference();
  // 8.7 change = referenceList may now be in top-level of state props, 
  //  not always in config of state props
  let { referenceList } = thePConn.getStateProps()?.config || thePConn.getStateProps();
  const pageReferenceForRows = referenceList.startsWith(".")
    ? `${pageReference}.${referenceList.substring(1)}`
    : referenceList;

  // removing "caseInfo.content" prefix to avoid setting it as a target while preparing pageInstructions
  referenceList = pageReferenceForRows.replace(
    PCore.getConstants().CASE_INFO.CASE_INFO_CONTENT,
    ""
  );

  return {
    contextName,
    referenceListStr: referenceList,
    pageReferenceForRows
  };
};

export const populateRowKey = (rawData) => {
  return rawData.map((row, index) => {
    return { ...row, index };
  });
};

export const getApiContext = (processedData, pConnect, reorderCB) => {
  return {
    fetchData: () => {
      return new Promise((resolve) => {
        resolve({
          data: processedData,
          filteredRecordCount: processedData.length,
          totalRecordCount: processedData.length
        });
      });
    },
    fetchPersonalizations: () => {
      return Promise.resolve({});
    },
    applyRowReorder: (sourceKey, destinationKey) => {
      // indexes are keys for simple table so, it should work.
      reorderCB();
      return Promise.resolve(
        pConnect
          .getListActions()
          .reorder(parseInt(sourceKey, 10), parseInt(destinationKey, 10))
      );
    }
  };
};

export const buildMetaForListView = (
  fieldMetadata,
  fields,
  type,
  ruleClass,
  name,
  propertyLabel,
  parameters
) => {
  return {
    name,
    config: {
      type,
      referenceList: fieldMetadata.datasource.name,
      parameters: parameters ?? fieldMetadata.datasource.parameters,
      personalization: false,
      grouping: true,
      globalSearch: true,
      reorderFields: true,
      toggleFieldVisibility: true,
      personalizationId: "" /* TODO */,
      template: "ListView",
      presets: [
        {
          name: "presets",
          template: "Table",
          config: {},
          children: [
            {
              name: "Columns",
              type: "Region",
              children: fields
            }
          ],
          label: propertyLabel,
          id: "P_" /* TODO */
        }
      ],
      ruleClass
    }
  };
};

export const buildFieldsForTable = (configFields, fields, showDeleteButton) => {
  const fieldDefs = configFields?.map((field, index) => {
    return {
      type: "text",
      label: fields[index].config.label || fields[index].config.caption,
      fillAvailableSpace: !!field.config.fillAvailableSpace,
      id: index,
      name: field.config.value.substr(4),
      cellRenderer: TABLE_CELL,
      sort: false,
      noContextMenu: true,
      showMenu: false,
      meta: {
        ...field
      },
      // BUG-615253: Workaround for autosize in table with lazy loading components
      width: getFiledWidth(field, fields[index].config.label)
    };
  });

  // ONLY add DELETE_ICON to fields when the table is requested as EDITABLE
  if (showDeleteButton) {
    fieldDefs.push({
      type: "text",
      label: "",
      name: DELETE_ICON,
      id: fieldDefs.length,
      cellRenderer: DELETE_ICON,
      sort: false,
      noContextMenu: true,
      showMenu: false,
      // BUG-615253: Workaround for autosize in table with lazy loading components
      width: 46
    });  
  }

  return fieldDefs;
};

export const createMetaForTable = (fields, renderMode) => {
  return {
    height: {
      minHeight: "auto",
      fitHeightToElement: "fitHeightToElement",
      deltaAdjustment: "deltaAdjustment",
      autoSize: true
    },
    fieldDefs: fields,
    itemKey: "index",
    grouping: false,
    reorderFields: false,
    reorderItems: renderMode === "Editable",
    dragHandle: renderMode === "Editable",
    globalSearch: false,
    personalization: false,
    toggleFieldVisibility: false,
    toolbar: false,
    footer: false,
    filterExpression: null,
    editing: false,
    timezone: PCore.getEnvironmentInfo().getTimeZone()
  };
};

/**
 * This method returns a callBack function for Add action.
 * @param {object} pConnect - PConnect object
 * @param {number} index - index of the page list to add
 */
export const getAddRowCallback = (pConnect, index) => {
  return () => pConnect.getListActions().insert({}, index);
};

/**
 * This method creates a PConnect object with proper options for Add and Delete actions
 * @param {string} contextName - contextName
 * @param {string} referenceList - referenceList
 * @param {string} pageReference - pageReference
 */
export const createPConnect = (contextName, referenceList, pageReference) => {
  const options = {
    context: contextName,
    pageReference,
    referenceList
  };

  // create PConnect object
  const config = { meta: {}, options };
  const { getPConnect } = PCore.createPConnect(config);

  return getPConnect();
};
