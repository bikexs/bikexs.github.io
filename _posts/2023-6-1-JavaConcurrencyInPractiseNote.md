---
title: java并发读书笔记
author: bikexs
date: 2023-5-11 7:00:00 +0800
categories: [graphics, game]
tags: [concurrnecy, java]
math: true
mermaid: true
---

### 《java并发编程实践》（中文版）读书笔记


### Chapter2 线程安全检查

实际多线程程序开发中，很多时候自己都很难察觉到其中可能存在的安全隐患，但不可否认，运行100次中有一次异常那么就是有问题的。


#### 竞态条件的常见判断方式（实际上也是在应用层面如何去判断可能存在的资源竞争）：

- 检查和修改复合操作

```java
class A {
  private Object instance = null;

  private A(){}

  public void getInstance(){
    if(instance == null){
      instance = new Object();
    }
  }
}
```

诸如此类的检查后修改均是非原子性操作，线程竞争时会可能出现异常状态更新的情况。

- 读-改-写复合操作

```java
class A {
  private int count = 0;
  public void increment(){
    count++;
  }
}
```

类如++之类的非原子行运算操作，实际最终的执行的字节码指令是 读、改、写三个操作，这三个操作是可被其他其他线程切换抢占执行的。


#### java中的synchronized和锁的分类

- 互斥锁（mutex）
synchronized属于互斥锁，即当一个线程拿到该互斥锁之后，另一个线程再获取该锁，将会阻塞（这一点不注意容易造成死锁）

synchronized死锁案例
```java
class A {

  public synchronized void doSomeThing(){
    System.out.println("do some thing");
  }

  public synchronized void readAndDo(){
    System.out.println("read and do");
    doSomeThing()
  }
}

public class Main(){
  public static void main(String []args){
    A a = new A();
    a.readAndDo();
  }
}
```

- 可重入锁（reentrant）

可重入锁意味着该锁可以多次进行加锁操作。在可重入锁的实现中，不是使用互斥量（0可用，非0不可用），而是使用信号量实现，每一次加锁操作，信号量值加1，
信号量值为0代表可用，每次释放信号量值减一。

java中提供了可重入锁的实现，ReentranLock等。

### chapter3 共享对象

#### 可见性

可见性导致的问题案例
```java
public class Main7 {
    public static boolean ready;
    public static int number;

    public static class ReaderThread implements Runnable{
        @Override
        public void run(){
            while(!ready){
//                Thread.yield();    // 加上这个之后是可以正常读取到主内存中更新的值的，猜测是线程从就绪态变为运行态时重新加载主内存中的数据到工作内存中。
            }
            System.out.println(number);
        }
    }

    public static void main(String[] args) {
        new Thread(new ReaderThread()).start();
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        number = 20;
        ready = true;
        System.out.println("ready: " + ready);
    }
}
```

上述程序无法正常执行，在`ReaderThread`中，while语句会一直阻塞在此处，即时主线程将`ready`设置为true之后。
这个主要原因就在于ReaderThread线程中，无法获取到主线程中对ready值的更新。

实际上，这个错误在生产者消费者模型中比较容易触犯。



