---
title: 万能的SpringAOP
author: bikexs
date: 2023-5-24 7:00:00 +0800
categories: [spring,java]
tags: [工作杂记,spring]
math: true
mermaid: true
---

### 1. 为什么要用AOP

先来看下最直接的两个典型的应用场景问题吧。
- REST接口权限管理应该很多人都做过，那REST接口权限控制如何实现。怎么保证灵活性。
- redis可能存在网络不稳定访问超时，怎么实现重试逻辑的复用。

这里简单说一下AOP对接口鉴权逻辑进行提取的实现。
![AOP权限控制逻辑实现](https://z1.ax1x.com/2023/12/10/piRcXCj.png)

在REST应用中，提供很多接口，有些接口需要进行鉴权才能使用（对于开放接口还会注册到API网关中对外进行开放）。这种情况下，如果能通过一个注解来标记哪些接口需要哪些权限，然后对这个接口执行指定的鉴权逻辑，这样的话一切就变得很方便了。而这个点就可以通过SpringAOP来进行实现。

而对于redis超时重试，同样可以通过AOP对方法进行一个处理，通过方法抛出的连接超时异常进行补货，进而对方法进行一个重新执行。

ps: 参与过的相遇中，也有直接通过spring security对路径进行匹配的，然后通过数据库配置接口的路径访问权限进行对应的处理。实际上这种方法不太方便，而且访问路径的数据来源是服务器程序本身，只有服务器本身才最清楚这个接口应该需要什么权限才能访问的，所以更推荐的是注解和AOP进行一个逻辑抽取。

### 2. Spring AOP基础和概念

先抛开官方的概念，简单来说AOP就是处理了一个问题：这个方法执行之前和之后需要进行一个前置处理和后置处理，而这个前置处理和后置处理的逻辑就称为切面，这个方法需要包裹一层逻辑的称为切点，前置处理、后置处理、环绕处理等这些就是称为通知，spring 将这些切点和切面连接起来的过程就是织入，这个织入的逻辑实现中需要用到一个代理来拦截这个目标方法的执行。在切面处理逻辑中，所输入的目标信息就是切点，也就是对应目标方法。

切面（Aspect）:
切面是一个模块，它封装了横切关注点的代码和相关通知。在Spring中，切面是由Java类定义的。

连接点（Join Point）:
连接点是在应用程序执行过程中能够插入切面的点。这些点可以是方法调用、异常抛出、字段访问等。

通知（Advice）:
通知定义了在连接点上执行的代码。在Spring AOP中，通知包括“前置通知”（Before Advice）、“后置通知”（After Advice）、“返回通知”（After Returning Advice）、“异常通知”（After Throwing Advice）和“环绕通知”（Around Advice）。

切点（Pointcut）:
切点定义了在哪里应该应用通知。它是连接点的集合，通常使用表达式语言定义。

目标对象（Target Object）:
目标对象是被一个或多个切面通知的对象。通常，它是应用程序中的一个普通Java对象。

代理（Proxy）:
代理是一个对象，它包装了目标对象，并拦截对目标对象的所有调用。Spring AOP可以通过动态代理或者CGLIB（Code Generation Library）来创建代理。

织入（Weaving）:
织入是将切面与目标对象连接起来的过程。它可以在编译时、类加载时、运行时进行。Spring AOP通常在运行时进行织入。

### 3. AOP使用场景经验和实现

就开头提到的鉴权控制进行实现。

#### 3.1 定义注解@AuthToken用于标记接口需要进行鉴权

定义注解：
```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface AuthToken {

    /**
     * 要求拥有对应业务模块的权限，空列表则仅仅做身份认证
     */
    BusinessType[] businessTypes() default {};

    /**
     * 指定支持业务模块中的哪些视图资源，空列表则表示支持业务模块中的所有视图资源
     */
    ViewResourceType[] viewResources() default {};

    /**
     * 指定支持业务模块的哪些任务资源，空列表则表示支持业务模块中的所有任务资源
     */
    TaskResourceType[] taskResourceTypes() default {};

    /**
     * 所需权限，默认读权限
     */
    PrivilegeType[] privileges() default {};

    boolean allowUnauthorized() default false;
}
```

#### 3.2 标记需要鉴权的接口（此处示例代码）
```java
// 此处省略其他代码
class AuthController {
  ...
  @GetMapping("view-resource")
  @AuthToken
  public AppResponse viewResource(){...}
  ...
}
```
#### 3.3 定义切面和实现鉴权除了逻辑(此处示例代码)
```java
// 定义切面
@Aspect
@Component
public class AuthTokenAspect {

    // 定义切点
    @Pointcut("@annotation(authToken)")
    public void annotatedWithAuthToken(AuthToken authToken) {}

    // 织入的具体逻辑实现，即前置逻辑和后置逻辑实现
    @Around("@annotation(cn.bikexs.service.annotation.AuthToken)")
    public Object handle(ProceedingJoinPoint joinPoint) throws Throwable {
        // 此处省略方法执行前的鉴权处理逻辑
        Object result = joinPoint.proceed();
        // 此处省略方法执行后的鉴权处理逻辑
        return result;
    }
}
```

### 4. AOP实现原理

搞清楚AOP的实现原理，实际上就是搞清楚这么个问题：在spring中怎么对一个方法加上一个前置逻辑和后置逻辑，前提是不能改变目标方法的实现。

前置知识：设计模式-代理模式（此处不说，简单说就是对一个方法再包裹一层进行增强）

JDK 动态代理：
- 接口：JDK动态代理要求目标对象必须实现一个接口。
代理对象创建：

- 当目标对象被代理时，Spring通过java.lang.reflect.Proxy类创建了一个实现了相同接口的代理对象。
InvocationHandler：

- 代理对象的所有方法调用都会被转发给InvocationHandler接口的实现，通常是一个切面。
织入切面：

- 在InvocationHandler的invoke方法中，Spring将切面的通知代码织入到目标方法的调用前、后、返回或抛出异常等位置。

CGLIB 动态代理：
- 类：CGLIB动态代理不要求目标对象实现接口。
代理对象创建：

- 当目标对象被代理时，Spring通过CGLIB库创建了一个目标对象的子类作为代理对象。
MethodInterceptor：

- 代理对象的所有方法调用都会被转发给MethodInterceptor接口的实现，通常是一个切面。
- 织入切面：在MethodInterceptor的intercept方法中，Spring将切面的通知代码织入到目标方法的调用前、后、返回或抛出异常等位置。

Spring用的啥？两者结合使用，目标方法实现接口用jdk，否则用CGLIB。
