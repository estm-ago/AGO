#ifndef ZLG_CONFIG_INTF_H
#define ZLG_CONFIG_INTF_H

struct _Meta;
struct _Pair;
struct _Options;
struct _ConfigNode;

typedef struct _Meta Meta;
typedef struct _Pair Pair;
typedef struct _Options Options;
typedef struct _ConfigNode ConfigNode;

/**
*  \struct Options
*Optional options for node mata.
*/
struct _Options
{
/*! Optional data types*/
const char * type;

/*! Optional values*/
const char * value;

/*! Optional description information*/
const char * desc;
};

/**
*  \struct Meta
*Node mata information.
*/
struct _Meta
{
/*The data type of the configuration item*/
const char * type;

/*Explanatory information for configuration items*/
const char * desc;

/*Is the configuration item read-only? The default is read-write*/
int read_only;

/*! Tips for input format of configuration items*/
const char * format;

/*For numeric configuration items, it is the minimum value, and for string configuration items, it is the minimum length (in bytes)*/
double min_value;

/*For numeric configuration items, it is the maximum value, and for string configuration items, it is the maximum length (in bytes)*/
double max_value;

/*Unit of configuration item*/
const char * unit;

/*The increment when modifying configuration items through knobs/rollers, etc*/
double delta;

/*Is the configuration item visible? True is visible, false is not visible. You can also bind an expression (refer to demo 3 for expression), which is visible by default*/
const char* visible;
    
/*Is this configuration item enabled? True enabled, false disabled, or can it be bound to an expression (refer to demo 3 for expression usage). Default Enable*/
const char* enable;

/*Optional value for configuration item, only valid when 'type' is an indirect type*/
int editable;

/*Optional value for configuration item, only valid when 'type' is an indirect type, ends with NULL*/
Options** options;
};

/**
*  \struct Pair
*The KeyValue of the attribute.
*/
struct _Pair
{
const char * key;
const char * value;
};

/**
*  \struct ConfigNode 
*  ConfigNode
*/
struct _ConfigNode
{
/*The name of the node*/
const char * name;
/*The value of a node can also be bound to an expression*/
const char * value;
/*The expression for the node value, when present, calculates the value from this expression*/
const char* binding_value;
/*The path of this node*/
const char * path;
/*! Configuration item information*/
Meta* meta_info;
/*The child nodes of this node end with NULL*/
ConfigNode** children;
/*The attribute of this node ends with NULL*/
Pair** attributes;
};

/**
*Retrieve the description information of the attribute.
*
* \retval ConfigNode
*/
typedef const ConfigNode* (*GetPropertysFunc)();

/**
*Set the value of the attribute of the specified path.
*\ parameter [in] path: The path of the attribute.
*\ param [in] value: The value of the attribute.
*
*Retval returns 1 for success and 0 for failure.
*/
typedef int (*SetValueFunc)(const char* path, const char* value);

/**
*Retrieve the value of the attribute of the specified path.
*\ parameter [in] path: The path of the attribute.
*Retval successfully returns the value of the property, while failure returns NULL.
*/
typedef const char* (*GetValueFunc)(const char* path);

typedef struct  tagIProperty
{
SetValueFunc     SetValue;
GetValueFunc     GetValue;
GetPropertysFunc GetPropertys;
}IProperty;

#endif/*ZLG_CONFIG_INTF_H*/

