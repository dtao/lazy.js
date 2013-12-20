//-----------------------------------------------------------------------
// Part of the LINQ to JavaScript (JSLINQ) v2.10 Project - http://jslinq.codeplex.com
// Copyright (C) 2009 Chris Pietschmann (http://pietschsoft.com). All rights reserved.
// This project is licensed under the Microsoft Reciprocal License (Ms-RL)
// This license can be found here: http://jslinq.codeplex.com/license
//-----------------------------------------------------------------------
(function() {
    JSLINQ = window.JSLINQ = function(dataItems) {
        return new JSLINQ.fn.init(dataItems);
    };
    JSLINQ.fn = JSLINQ.prototype = {
        init: function(dataItems) {
            this.items = dataItems;
        },

        // The current version of JSLINQ being used
        jslinq: "2.10",

        ToArray: function() { return this.items; },
        Where: function(clause) {
            var item;
            var newArray = new Array();

            // The clause was passed in as a Method that return a Boolean
            for (var index = 0; index < this.items.length; index++) {
                if (clause(this.items[index], index)) {
                    newArray[newArray.length] = this.items[index];
                }
            }
            return new JSLINQ(newArray);
        },
        Select: function(clause) {
            var item;
            var newArray = new Array();

            // The clause was passed in as a Method that returns a Value
            for (var i = 0; i < this.items.length; i++) {
                if (clause(this.items[i])) {
                    newArray[newArray.length] = clause(this.items[i]);
                }
            }
            return new JSLINQ(newArray);
        },
        OrderBy: function(clause) {
            var tempArray = new Array();
            for (var i = 0; i < this.items.length; i++) {
                tempArray[tempArray.length] = this.items[i];
            }
            return new JSLINQ(
            tempArray.sort(function(a, b) {
                var x = clause(a);
                var y = clause(b);
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            })
        );
        },
        OrderByDescending: function(clause) {
            var tempArray = new Array();
            for (var i = 0; i < this.items.length; i++) {
                tempArray[tempArray.length] = this.items[i];
            }
            return new JSLINQ(
            tempArray.sort(function(a, b) {
                var x = clause(b);
                var y = clause(a);
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            })
        );
        },
        SelectMany: function(clause) {
            var r = new Array();
            for (var i = 0; i < this.items.length; i++) {
                r = r.concat(clause(this.items[i]));
            }
            return new JSLINQ(r);
        },
        Count: function(clause) {
            if (clause == null)
                return this.items.length;
            else
                return this.Where(clause).items.length;
        },
        Distinct: function(clause) {
            var item;
            var dict = new Object();
            var retVal = new Array();
            for (var i = 0; i < this.items.length; i++) {
                item = clause(this.items[i]);
                // TODO - This doens't correctly compare Objects. Need to fix this
                if (dict[item] == null) {
                    dict[item] = true;
                    retVal[retVal.length] = item;
                }
            }
            dict = null;
            return new JSLINQ(retVal);
        },
        Any: function(clause) {
            for (var index = 0; index < this.items.length; index++) {
                if (clause(this.items[index], index)) { return true; }
            }
            return false;
        },
        All: function(clause) {
            for (var index = 0; index < this.items.length; index++) {
                if (!clause(this.items[index], index)) { return false; }
            }
            return true;
        },
        Reverse: function() {
            var retVal = new Array();
            for (var index = this.items.length - 1; index > -1; index--)
                retVal[retVal.length] = this.items[index];
            return new JSLINQ(retVal);
        },
        First: function(clause) {
            if (clause != null) {
                return this.Where(clause).First();
            }
            else {
                // If no clause was specified, then return the First element in the Array
                if (this.items.length > 0)
                    return this.items[0];
                else
                    return null;
            }
        },
        Last: function(clause) {
            if (clause != null) {
                return this.Where(clause).Last();
            }
            else {
                // If no clause was specified, then return the First element in the Array
                if (this.items.length > 0)
                    return this.items[this.items.length - 1];
                else
                    return null;
            }
        },
        ElementAt: function(index) {
            return this.items[index];
        },
        Concat: function(array) {
            var arr = array.items || array;
            return new JSLINQ(this.items.concat(arr));
        },
        Intersect: function(secondArray, clause) {
            var clauseMethod;
            if (clause != undefined) {
                clauseMethod = clause;
            } else {
                clauseMethod = function(item, index, item2, index2) { return item == item2; };
            }

            var sa = secondArray.items || secondArray;

            var result = new Array();
            for (var a = 0; a < this.items.length; a++) {
                for (var b = 0; b < sa.length; b++) {
                    if (clauseMethod(this.items[a], a, sa[b], b)) {
                        result[result.length] = this.items[a];
                    }
                }
            }
            return new JSLINQ(result);
        },
        DefaultIfEmpty: function(defaultValue) {
            if (this.items.length == 0) {
                return defaultValue;
            }
            return this;
        },
        ElementAtOrDefault: function(index, defaultValue) {
            if (index >= 0 && index < this.items.length) {
                return this.items[index];
            }
            return defaultValue;
        },
        FirstOrDefault: function(defaultValue) {
            return this.First() || defaultValue;
        },
        LastOrDefault: function(defaultValue) {
            return this.Last() || defaultValue;
        }
    };
    JSLINQ.fn.init.prototype = JSLINQ.fn;
})();