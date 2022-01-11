import React, { useState, useContext } from "react";
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import Accordion from "@material-ui/core/Accordion";
import { AccordionDetails, AccordionSummary } from '@material-ui/core';
import { Button } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import AddIcon from "@material-ui/icons/AddBox";
import DeleteIcon from "@material-ui/icons/Delete";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { FormContext } from "../../FormContext";
import DragHandleIcon from "@material-ui/icons/DragIndicator";
import deleteKey from "../utils/deleteKey";
import EditElement from "../EditElement";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ArrayItemRenderer from "./ArrayItemRenderer";
import generateUniqueID from "../utils/generateUniqueID";
import { IconButton } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
    },
    heading: {
        color: 'rgba(82, 94, 103, 1)',
        fontSize: theme.typography.pxToRem(25),
        fontWeight: theme.typography.fontWeightRegular,
    },
}));

const ArrayType = ({ pathSchema, path, field_required, field_id, field_index, edit, field_label, field_description, field_items, field_prefixItems }) => {
    const [openDialog, setOpenDialog] = useState(false);
    const [expand, setExpand] = useState(true); // set to "true" for normally open accordion
    const { convertedSchema } = useContext(FormContext);
    const [inputItems, setInputItems] = useState([]);
    const [dataInputItems, setDataInputItems] = useState([]);
    const [itemSchema, setItemSchema] = useState();

    // This is to expand or contract the accordion, because normally open is used 
    const expandOnChange = () => {
        const value = expand
        setExpand(!value)
    };


    var required;
    if (field_required === undefined) {
        required = false;
    } else if (field_required.includes(field_id)) {
        required = true;
    };

    // update the order in properties on drag end
    const handleOnDragEnd = (result) => {
        if (!result.destination) return;

        // for schema
        let arr = inputItems
        const items = Array.from(arr);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setInputItems(items)

        // for data
        let arr2 = dataInputItems
        const items2 = Array.from(arr2);
        const [reorderedItem2] = items2.splice(result.source.index, 1);
        items2.splice(result.destination.index, 0, reorderedItem2);
        setDataInputItems(items2)
    }



    const classes = useStyles();

    // construct UI schema
    let UISchema = {
        "fieldId": field_id,
        "title": field_label,
        "description": field_description,
        "items": field_items,
        "type": "array"
    }

    // handle add array item
    const handleAddArrayItem = () => {
        if (field_prefixItems === undefined & field_items !== undefined) {
            if (Object.keys(field_items).length === 0) {
                // create field_items if items is empty
                field_items = { type: "string", field_id: `${generateUniqueID()}` }
                let arr = inputItems;
                const items = Array.from(arr);
                items.push(field_items);
                setInputItems(items);

                // push a new item for the data
                let arr2 = dataInputItems;
                const items2 = Array.from(arr2);
                items2.push("");
                setDataInputItems(items2)
            } else {
                // use existing schema if items is not empty
                let newFieldItems = JSON.parse(JSON.stringify(field_items))
                newFieldItems["field_id"] = generateUniqueID();
                let arr = inputItems;
                const items = Array.from(arr);
                items.push(newFieldItems);
                setInputItems(items);

                if (["string", "number", "integer", "boolean"].includes(newFieldItems["type"])) {
                    // push a new item for the data
                    let arr2 = dataInputItems;
                    const items2 = Array.from(arr2);
                    items2.push("");
                    setDataInputItems(items2)
                } else if (newFieldItems["type"] === "object") {
                    let arr2 = dataInputItems;
                    const items2 = Array.from(arr2);
                    items2.push({});
                    setDataInputItems(items2)
                }
            }
        }
    }

    // handle delete item
    const handleDeleteArrayItem = (index) => {
        // for schema
        let arr = inputItems
        const items = Array.from(arr);
        items.splice(index, 1);
        setInputItems(items)

        // for data
        let arr2 = dataInputItems;
        const items2 = Array.from(arr2);
        items2.splice(index, 1);
        setDataInputItems(items2)
    }

    return (<>
        <div style={{ width: "100%", padding: "10px 0px 10px 0px" }}>
            <Accordion expanded={expand} >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                    IconButtonProps={{
                        onClick: expandOnChange
                    }}
                >
                    <div style={{ paddingTop: "10px", paddingBottom: "10px", display: 'inline-flex', width: '100%' }}>
                        <div style={{ width: "100%" }}>
                            <Typography className={classes.heading}>{field_label + (required ? "*" : "")}</Typography>
                            {expand ? <div style={{ color: "gray" }}>
                                {field_description}
                            </div> : null}
                        </div>
                    </div>
                </AccordionSummary>
                <Divider />
                <AccordionDetails>
                    <DragDropContext onDragEnd={handleOnDragEnd}>
                        <Droppable droppableId="subforms">
                            {(provided) => (
                                <div style={{ width: "100%" }}  {...provided.droppableProps} ref={provided.innerRef}>
                                    {Object.keys(inputItems).map((item, index) => {
                                        return (
                                            <Draggable isDragDisabled={false} key={inputItems[index]["field_id"]} draggableId={inputItems[index]["field_id"]} index={index}>
                                                {(provided) => (
                                                    <div {...provided.draggableProps} ref={provided.innerRef}>
                                                        <div style={{ display: "flex" }}>
                                                            <div style={{ width: "20px", marginTop: "10px", height: "30px" }} {...provided.dragHandleProps}>
                                                                <DragHandleIcon fontSize="small" />
                                                            </div>
                                                            <ArrayItemRenderer pathSchema={pathSchema} dataInputItems={dataInputItems} setDataInputItems={setDataInputItems} field_label={field_label} field_items={field_items} edit={true} handleDeleteArrayItem={handleDeleteArrayItem} path={path + ".properties"} fieldIndex={index} fieldId={inputItems[index]["field_id"]} type={inputItems[index]["type"]} />
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                    {provided.placeholder}
                                    <div style={{ display: "flex", justifyContent: "right" }}>
                                        <IconButton onClick={() => { handleAddArrayItem() }} style={{ marginLeft: "5px", marginTop: "5px", height: "45px" }}><AddIcon fontSize="small" color="primary" /></IconButton>
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </AccordionDetails>
            </Accordion>
        </div>
    </>
    );
};

export default ArrayType;