---
title: SpringMVC自定义验证器注解
author: bikexs
date: 2023-5-24 7:00:00 +0800
categories: [java, spring]
tags: [工作杂记]
math: true
mermaid: true
---

### 1. 问题背景

spring MVC中，@RequestParam对参数进行处理的时候，是不会根据@JsonProperty将字段映射到对应字段中，也就是`xxx_xxx`会直接映射然后注入到`xxx_xxx`的属性中，而在@RequestBody中，默认会对其映射到小写驼峰命名的属性字段中，定义了@JsonProperty时，会根据注解中定义的名称映射到对应字段。

本文主要增加一个注解，支持多个将多个GET参数映射到对象中，并且根据@JsonProperty的定义进行自定义映射。

### 2. springMVC执行执行流程和属性注入执行流程

- 2.1 DispatchServlet通过调用各个HandlerAdapter进行对请求进行处理。
- 2.2 RequestMappingHandlerAdapter中则会负责处理参数映射。其中的InvocableHandlerMethod就会调用HandlerMethodArgumentResolver的实现类进行参数映射。

```java
public class InvocableHandlerMethod extends HandlerMethod {

    // ...

    public Object invokeForRequest(NativeWebRequest request, ModelAndViewContainer mavContainer, Object... providedArgs) throws Exception {
        // ...

        // 解析方法参数
        Object[] args = getMethodArgumentValues(request, mavContainer, providedArgs);

        // ...

        // 调用处理器方法
        return doInvoke(args);
    }

    protected Object[] getMethodArgumentValues(NativeWebRequest request, ModelAndViewContainer mavContainer, Object... providedArgs) throws Exception {
        MethodParameter[] parameters = getMethodParameters();
        Object[] args = new Object[parameters.length];

        for (int i = 0; i < parameters.length; i++) {
            MethodParameter parameter = parameters[i];
            parameter.initParameterNameDiscovery(getParameterNameDiscoverer());
            args[i] = findProvidedArgument(parameter, providedArgs);
            if (args[i] == null) {
                if (!this.resolvers.supportsParameter(parameter)) {
                    throw new IllegalStateException("No suitable resolver for argument " + parameter);
                }
                try {
                    args[i] = this.resolvers.resolveArgument(parameter, mavContainer, request, this.dataBinderFactory);
                } catch (Exception ex) {
                    // Exception handling logic
                }
            }
        }
        return args;
    }

    // ...
}
```


结论：实现这个HandlerMethodArgumentResolver接口，将其作为组件放入到spring中，sprinvMVC就会自动调用执行了。

### 3. 实现

#### 3.1 新定义一个注解

```
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface GetRequestParam {
}
```

#### 3.2 自定义参数解析逻辑
```
@Component
public class GetRequestMethodProcessor implements HandlerMethodArgumentResolver {

    private static final String SET = "set";

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(GetRequestParam.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer, NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {
        Class<?> clazz = parameter.getParameterType();
        Object target;
        try {
            target = processFiledValue(webRequest, clazz);
        } catch (Exception e) {
            e.printStackTrace();
            throw new ServiceException("请求参数解析错误", AppResponseCode.PARAMTER_NOT_VALID);
        }
        return target;
    }

    private Object processFiledValue(NativeWebRequest webRequest, Class<?> clazz) throws Exception {
        Object target = clazz.newInstance();
        Field[] declaredFields = clazz.getDeclaredFields();
        List<Field> fields = new ArrayList<>();
        fields.addAll(Arrays.stream(declaredFields).toList());
        Class cls = clazz.getSuperclass();
        while (cls != Object.class) {
            fields.addAll(Arrays.stream(cls.getDeclaredFields()).toList());
            cls = cls.getSuperclass();
        }
        for (Field declaredField : fields) {
            JsonProperty annotation = declaredField.getAnnotation(JsonProperty.class);
            String filedName = Objects.nonNull(annotation) ? annotation.value() : declaredField.getName();
            String value = getParamValue(webRequest, filedName);
            if (AppChecker.isBlank(value)) {
                continue;
            }
            Object parseObj = processFiledType(declaredField, value);
            Method declaredMethod = clazz
                    .getMethod(getMethodName(declaredField.getName()), declaredField.getType());
            declaredField.setAccessible(true);
            declaredMethod.invoke(target, parseObj);
        }
        return target;
    }

    /**
     * get请求，只处理key:value格式参数，数组、对象请直接放到body中
     */
    private Object processFiledType(Field declaredField, String value) {
        Object resultValue = value;
        String fieldType = declaredField.getType().getName();

        if (Objects.equals(fieldType, Integer.class.getName())) {
            resultValue = Integer.valueOf(value);
        } else if (Objects.equals(fieldType, String.class.getName())) {
            resultValue = value;
        } else if (Objects.equals(fieldType, Byte.class.getName())) {
            resultValue = Byte.valueOf(value);
        } else if (Objects.equals(fieldType, Long.class.getName())) {
            resultValue = Long.valueOf(value);
        } else if (Objects.equals(fieldType, Double.class.getName())) {
            resultValue = Double.valueOf(value);
        }
        return resultValue;
    }

    private String getMethodName(String name) {
        return SET + name.substring(0, 1).toUpperCase() + name.substring(1);
    }

    private String getParamValue(NativeWebRequest webRequest, String fieldName) {
        return webRequest.getParameter(fieldName);
    }
}
```