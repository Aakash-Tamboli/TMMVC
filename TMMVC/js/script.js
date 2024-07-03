// global variables

var tmmvc = {
    "startup": [],
    "model": null,
};

const TMMVC_BIND_TO = "tmmvc-bind-to";
const TMMVC_ATTRIBUTE = "tmmvc-attribute";


tmmvc.onStartup = function (callBack) {
    tmmvc.startup[tmmvc.startup.length] = callBack;
}

// syntax to creating nested class(mimic the nested class feature in js)
/*
class A{
..
..
static B=class{
static func(){
..
}
}
}
we can access A.B.func()
*/

class Components {

    static InputTag = class {
        static typeEqualsToText(tag) {
            let key = tag.getAttribute("tmmvc-attribute");
            // validation later on
            let value = tmmvc.model[key];
            if (tag.hasAttribute("tmmvc-bind-to")) {
                let tmmvc_bind_to = tag.getAttribute(TMMVC_BIND_TO);
                // if tmmc_bind_to value not available in tag then nothing will be set at startup time
                tag.setAttribute(tmmvc_bind_to, value);
            }
            else {
                tag.value = value;
            }

            tag.addEventListener('input', (event) => {
                let key = tag.getAttribute("tmmvc-attribute");
                tmmvc.model[key] = event.target.value;

                let intervalId = setInterval(() => {
                    if (tmmvc.model[key] != tag.value) {
                        event.target.value = tmmvc.model[key];
                        clearInterval(intervalId); // stop the setInterval function
                    }
                }, 1000);

            });
        }
        static typeEqualsToRadio(tag) {
            let key = tag.getAttribute("tmmvc-attribute");
            // validation later on
            let allCorrespondingRadioButton = null;
            // binding wala khel abhi implement krna hai
            if (tmmvc.model[key] == "") {
                // allCorrespondingRadioButton based on name factor
                allCorrespondingRadioButton = document.getElementsByName(tag.name);
                for (let j = 0; j < allCorrespondingRadioButton.length; j++) {
                    allCorrespondingRadioButton[j].checked = false;
                }
            }
            else {
                allCorrespondingRadioButton = document.getElementsByName(tag.name);
                for (let j = 0; j < allCorrespondingRadioButton.length; j++) {
                    if (allCorrespondingRadioButton[j].value == tmmvc.model[key]) {
                        allCorrespondingRadioButton[j].checked = true;
                    }
                }
            }

            tag.addEventListener('click', (event) => {
                tmmvc.model[key] = event.target.value;
            });
        }
        static typeEqualsToCheckbox(tag) {
            let key = tag.getAttribute("tmmvc-attribute");
            let value = tmmvc.model[key];
            if (typeof (value) == "string") value = value.trim();
            /*
            if value is 0, null, undefined, ""(empty string) it means false
            otherwise we consider as true whatever value against it.
            // Docs Marker
            */
            if (tag.hasAttribute(TMMVC_BIND_TO)) {
                let tmmvc_bind_to = tag.getAttribute(TMMVC_BIND_TO);
                tag.setAttribute(tmmvc_bind_to, value);
            }
            else {
                tag.value = value;
            }

            if (value == false || value == 0 || value == null || value == undefined || value == "") {
                tag.checked = false;
            }
            else {
                tag.checked = true;
            }

            tag.addEventListener('click', (event) => {
                tmmvc.model[key] = event.target.checked;
            });

        }
    } // inner class

    static SelectTag = class {
        static analyzeAndPreProcess(tag) {
            let key = tag.getAttribute("tmmvc-attribute");
            // validation is pending
            let value = tmmvc.model[key];
            const options = tag.options;
            if (Array.isArray(value)) {
                /*
                Docs Marker
                I'll specify in docs that 
                1st for using select & option feature user must take array props in DS,
                2nd if user want that by default some specify option is being select then
                    guideline will be
                    Either Array must be contains boolean or 0|1 value as No. of
                    times in an array as no. of options it taken 
                3rd each option value represting array index
                4th whereas each options text is store in array
                    For Self: I think I have to discuss about this feature with Sir,
                                How it should be used by user.
                */
                if (value.length == options.length) {
                    for (let i = 0; i < options.length; i++) {
                        if (value[i] == "undefined") continue;
                        else if (value[i] == true || value[i] == 1) {
                            value[i] = options[i].text;
                            options[i].selected = true;
                            break;
                        }
                    }
                    tag.addEventListener('click', (event) => {
                        let index = Number(event.target.value)
                        value[index] = options[index].text;
                    });
                }
            }
        }
    } // inner class
    static TextAreaTag = class {
        static analyzeAndPreProcess(tag) {
            let key = tag.getAttribute(TMMVC_ATTRIBUTE);
            let value = tmmvc.model[key];

            if (tag.hasAttribute(TMMVC_BIND_TO)) {
                let targetAttribute = tag.getAttribute(TMMVC_BIND_TO);
                if (targetAttribute == "value") {
                    /*
                    Note on <textarea> and value
                    For <textarea> elements, 
                    it's important to note that setting the value attribute 
                    via setAttribute may not update the displayed content in some browsers. 
                    Instead, use the value property directly: 
                                                    ~Source ChatGPT
                    */
                    tag.value = value;
                }
                else if (targetAttribute == "defaultValue") {
                    tag.defaultValue = value;
                }
                else {
                    tag.setAttribute(targetAttribute, value);
                }
            }
            else {
                tag.value = value;
            }

            tag.addEventListener('keyup', (event) => {
                tmmvc.model[key] = event.target.value;
            })

        }
    }
} // outer class


class View {
    static updateView() {
        const regularExpression = /\{\{(.*?)\}\}/g; // credit goes to chat-gpt
        let original = document.body.innerHTML;
        let result = undefined;
        const regularExpressionWithWords = {};
        while (true) {
            /*
                Acc. to observation while playing with regular expression:
                0th index contains word with regularExpression thing
                1st index contains only word
                2nd index contains groups (whic I don't know what it is)
                3rd index contains index where that word with regular expression found
                ...
            */
            result = regularExpression.exec(original);
            if (result == null) break;
            regularExpressionWithWords[result[0]] = result[1];
        }

        const words = Object.entries(regularExpressionWithWords);

        for (let i = 0; i < words.length; i++) {
            if (words[i][1] == "" || words[i][1] == "null") {
                // it means TMMVC user uses {{}} but not give any variable name then space will be put
                original = original.replace(words[i][0], "");
            }
            else if (ds[words[i][1]] == undefined) {
                // it means TMMVC user uses {{varible_name}} where variable name is not present in ds as key then I'll, not replace with anything
                continue;
            }
            else {
                original = original.replace(words[i][0], ds[words[i][1]]);
            }
        }
        document.body.innerHTML = original;
    }
}


class Model {
    static injectObserver(model) {
        Object.keys(model).forEach((key) => {
            let value = model[key];
            Object.defineProperty(model, key, {
                get() {
                    return value;
                },
                set(newValue) {
                    value = newValue;
                    View.updateView();
                },
                configurable: true,
                enumerable: true,
            });
        });
    }
}




function analyze(tags) {
    for (let i = 0; i < tags.length; i++) {
        if (tags[i].tagName == "INPUT") {
            if (tags[i].getAttribute("type") == "text" || tags[i].getAttribute("type" == "textbox")) Components.InputTag.typeEqualsToText(tags[i]);
            else if (tags[i].getAttribute("type") == "radio") Components.InputTag.typeEqualsToRadio(tags[i]);
            else if (tags[i].getAttribute("type") == "checkbox") Components.InputTag.typeEqualsToCheckbox(tags[i]);
        }
        else if (tags[i].tagName == "SELECT") Components.SelectTag.analyzeAndPreProcess(tags[i]);
        else if (tags[i].tagName == "TEXTAREA") Components.TextAreaTag.analyzeAndPreProcess(tags[i]);
    } // loop ends
} // analyze function ends


tmmvc.init = function () {
    if (tmmvc.model != null) {
        Model.injectObserver(tmmvc.model);
        let tags = document.querySelectorAll("[tmmvc-attribute]");
        if (tags != null && tags.length > 0) {
            analyze(tags);
        } // closing if when HTML Doc contains tags which applied tmmvc-attribute thing
    } // if model ends
} // init function ends


window.addEventListener('load', function () {
    for (let i = 0; i < tmmvc.startup.length; i++) tmmvc.startup[i]();
    tmmvc.init();
    View.updateView();
});

// <!-- above section is written by TMMVC Framework creator-->
