---
title: java stream知识点整理
author: bikexs
date: 2023-5-24 7:00:00 +0800
categories: [java, stream]
tags: [java基础]
math: true
mermaid: true
---

## 1. Stream基本使用

### 1.1 创建stream
```java
/**
 * 1.1 创建Stream
 */
public static void main(String[] args) {
    String[] arr = {"a", "b", "c"};
    Stream<String> stream = Stream.of(arr);
    System.out.println(stream.collect(Collectors.toList()));
    //  or
    Stream<String> stream1 = Arrays.stream(arr);
    System.out.println(stream1.collect(Collectors.toList()));
}
```

### 1.2 stream并行流处理多线程
```java
/**
 * 1.2 使用并行流，Collection中提供了parallelStream返回一个并行流执行对象
 */
public static void main(String[] args) {
    String[] arr = {"a", "b", "c"};
    List<String> strings = Arrays.asList(arr);
    strings.parallelStream().forEach((s)->{
        System.out.println(Thread.currentThread().getName() + ": " + s);
    });
}
```

### 1.3 strem基本操作
```java
/**
 * 1.3 stream基本操作。
 * stream提供的操作类可分为两类，一类是中间操作，返回一个流，可进行级联；
 * 一类是终止操作，不会返回流，而是返回特定的类型。
 */
public static void main(String[] args) {
    String[] arr = {"a", "b", "c", "a"};
    // 1.3.1 计数操作count。注意count是一个终止操作，使用完后流已经被关闭无法再次使用。
    long count = Stream.of(arr).count();
    System.out.println("count: " + count);
    count = Stream.of(arr).distinct().count();
    System.out.println("distinct count: " + count);

    // 1.3.2 匹配操作Matching。终止操作
    boolean res = Stream.of(arr).allMatch(s -> s.contains("a"));    // 所有项均匹配
    System.out.println("allMatch res: " + res);
    res = Stream.of(arr).anyMatch(s -> s.contains("a"));    // 任意项匹配
    System.out.println("anyMatch res: " + res);
    res = Stream.of(arr).noneMatch(s -> s.contains("a"));   // 所有项均不匹配
    System.out.println("noneMatch res: " + res);

    // 1.3.3 过滤操作filtering。中间操作。
    List<String> filterList1 = Stream.of(arr).filter(s -> s.contains("a")).collect(Collectors.toList());
    System.out.println("filter: " + filterList1);

    // 1.3.4 映射处理mapping。中间操作
    List<String> mapList1 = Stream.of(arr).map(s -> "mapping-" + s).collect(Collectors.toList());
    System.out.println("mapping list: " + mapList1);

    // 1.3.5 flatMap展开内部流。中间操作。类似js中的...自动帮你解包（即展开对象或数组）
    class Person {
        List<String> name;

        public Person(List<String> name) {
            this.name = name;
        }

        public List<String> getName() {
            return name;
        }
    }

    List<Person> persons = Arrays.asList(
            new Person(Arrays.asList("aa", "aaa")),
            new Person(Arrays.asList("cc", "ccc")),
            new Person(Arrays.asList("bb", "bbb"))
            );
    List<List<String>> mappingList2 = persons.stream().map(p -> p.getName().stream().collect(Collectors.toList())).collect(Collectors.toList());
    System.out.println("mapping list2: " + mappingList2);
    List<String> flatMapList2 = persons.stream().flatMap(p -> p.getName().stream()).collect(Collectors.toList());
    System.out.println("flatMap list2: " + flatMapList2);

    // 1.3.6 累积运算。终止操作。
    // (initValue, (accumulate, item)), initValue为初始值，accumulate为累计的运算结果的值，item为每一项的值。
    List<Integer> intList1 = Arrays.asList(1, 2, 3);
    Integer reduceRes = intList1.stream().reduce(100, (a, b) -> a + b); // 100为初始值进行求和
    System.out.println("reduce res: " + reduceRes);
    // 最大最小值计算
    int reduceMax = intList1.stream().reduce(Integer.MIN_VALUE, (a, b) -> Math.max(a, b));
    System.out.println("reduce max: " + reduceMax);
    int reduceMin = intList1.stream().reduce(Integer.MAX_VALUE, (a, b) -> Math.min(a, b));
    System.out.println("reduce min: " + reduceMin);
    // 总和计算
    int reduceSum = intList1.stream().reduce(0, (a, b) -> a + b);
    System.out.println("reduce sum: " + reduceSum);
    // 字符串拼接
    String stringJoin = Stream.of(arr).reduce("#", (a, b) -> a + "-" + b);
    System.out.println("string join: " + stringJoin);

    // 1.3.7 转换为集合的工具collect。终止操作。
    List<String> collectRes = Stream.of(arr).map(s -> s.toUpperCase(Locale.ROOT)).collect(Collectors.toList());
    System.out.println("collect res: " + collectRes);

    // 1.3.8 流中的数据消费peek。中间操作。
    // 注意所有中间操作都是惰性的，在没有终止操作之前，中间操作均不会执行。
    System.out.println("带终止操作的peek: ");
    Stream.of(arr)
            .peek(s->s.toUpperCase(Locale.ROOT))
            .forEach(System.out::print);
    System.out.println();
    System.out.println("不带终止操作的peek: ");
    Stream.of(arr)
            .peek(s-> System.out.print(s)); // 不带终止操作，peek中的操作并不会执行
}
```

output:
```
count: 4
distinct count: 3
allMatch res: false
anyMatch res: true
noneMatch res: false
filter: [a, a]
mapping list: [mapping-a, mapping-b, mapping-c, mapping-a]
mapping list2: [[aa, aaa], [cc, ccc], [bb, bbb]]
flatMap list2: [aa, aaa, cc, ccc, bb, bbb]
reduce res: 106
reduce max: 3
reduce min: 1
reduce sum: 6
string join: #-a-b-c-a
collect res: [A, B, C, A]
带终止操作的peek: 
abca
不带终止操作的peek: 
```

### 2、Collectors中提供的转换工具（有空补充）

### 3、常见使用技巧（后续用到持续补充）

