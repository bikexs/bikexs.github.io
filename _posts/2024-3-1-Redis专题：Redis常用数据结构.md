---
title: Redis专题：Redis常用数据结构
author: bikexs
date: 2024-3-1 7:00:00 +0800
categories: [Java]
tags: [Redis]
math: true
mermaid: true
---

### 一、背景：

​	没啥背景，主要是详细了解下redis都有哪些数据结构，以及其中的实现方式，对常用写法背后的具体原理进行了解。

https://github.com/redis/redis 不保证本文内容绝对正确，可以结合redis源码进行查看。

《redis设计和实现》参考书目。有的地方可以不一定对，自行判断。

http://redis.io/topics/data-types，参考文档

### 二、常用redis数据结构

#### 2.1、string（动态字符串）

##### 2.1.0、常用场景

- 计数器功能，可以使用incr指令实现自增操作
- 系统配置值，比如token数据，session数据，ip访问次数等等

```java
public class RedisUtils {
	@Autowired
    private RedisTemplate<String, Object> redisTemplate;

    public void saveString(String key, String value) {
        redisTemplate.opsForValue().set(key, value);
    }
}
```

以上是一个常见的redis操作的写法。下面围绕几个问题进行展开。

##### 2.1.1、string类型使用的什么数据结构进行存储的？

SDS，动态字符串。具体数据结构如下：

```
struct sdshdr {
	int len;
	int free;
	// 注意下这个char[]，是存储的字节数组，也就是说是可以存储二进制数据的，不会因为某些空字符而导致
	// 字符串结尾被错误的判断。
	char buf[];
}
```

set操作时是如何处理缓冲区的内存空间的？

类似java中的string，每一次的更新都是会对string进行缓冲区的更新的，再空间不足的时候则会重新分配缓存空间。

redis中的string也是类似，SDS中主要实现的是空间预分配和惰性空间释放两种策略。

空间预分配：分配额外的未使用空间。

- 修改的字符串长度小于1MB，分配和字符串长度相同的空间，也就是1000字节长度的字符串，会分配额外的1000字节空间，这个时候len和free的值是相同的。
- 修改的字符串长度大于等于1MB，只会分配1MB的空间。也就是说往字符串中放入一个30MB长度的字符串，也只会保存一个1MB的额外空间。

惰性空间释放：缩短字符串时，不立即释放内存，只标记free，等到合适的时机再把内存进行释放。具体释放时机

- 内存回收时。内存分配器自动内存回收和显式内存回收`MEMORY PURGE`。
- 删除key。当key被删除的时候对应的内存空间会被回收。

有关字符串内存的分配的源代码。

```
sds _sdsnewlen(const void *init, size_t initlen, int trymalloc) {
    void *sh;
    sds s;
    char type = sdsReqType(initlen);
    /* Empty strings are usually created in order to append. Use type 8
     * since type 5 is not good at this. */
    if (type == SDS_TYPE_5 && initlen == 0) type = SDS_TYPE_8;
    int hdrlen = sdsHdrSize(type);
    unsigned char *fp; /* flags pointer. */
    size_t usable;

    assert(initlen + hdrlen + 1 > initlen); /* Catch size_t overflow */
    sh = trymalloc?
        s_trymalloc_usable(hdrlen+initlen+1, &usable) :
        s_malloc_usable(hdrlen+initlen+1, &usable);
    if (sh == NULL) return NULL;
    if (init==SDS_NOINIT)
        init = NULL;
    else if (!init)
        memset(sh, 0, hdrlen+initlen+1);
    s = (char*)sh+hdrlen;
    fp = ((unsigned char*)s)-1;
    usable = usable-hdrlen-1;
    if (usable > sdsTypeMaxSize(type))
        usable = sdsTypeMaxSize(type);
    switch(type) {
        case SDS_TYPE_5: {
            *fp = type | (initlen << SDS_TYPE_BITS);
            break;
        }
        case SDS_TYPE_8: {
            SDS_HDR_VAR(8,s);
            sh->len = initlen;
            sh->alloc = usable;
            *fp = type;
            break;
        }
        case SDS_TYPE_16: {
            SDS_HDR_VAR(16,s);
            sh->len = initlen;
            sh->alloc = usable;
            *fp = type;
            break;
        }
        case SDS_TYPE_32: {
            SDS_HDR_VAR(32,s);
            sh->len = initlen;
            sh->alloc = usable;
            *fp = type;
            break;
        }
        case SDS_TYPE_64: {
            SDS_HDR_VAR(64,s);
            sh->len = initlen;
            sh->alloc = usable;
            *fp = type;
            break;
        }
    }
    if (initlen && init)
        memcpy(s, init, initlen);
    s[initlen] = '\0';
    return s;
}
```



ps: 参考数中有关字符串数据结构的，sdstrim说成是去除所有字符，不知道是不是版本的原因，实际代码应该是去除的首尾。

```
sds sdstrim(sds s, const char *cset) {
    char *end, *sp, *ep;
    size_t len;

    sp = s;
    ep = end = s+sdslen(s)-1;
    while(sp <= end && strchr(cset, *sp)) sp++;
    while(ep > sp && strchr(cset, *ep)) ep--;
    len = (ep-sp)+1;
    if (s != sp) memmove(s, sp, len);
    s[len] = '\0';
    sdssetlen(s,len);
    return s;
}
```





##### 2.1.2、是否存在长度限制，假如存入一个非常长的字符串，会不会出现某些问题？

有限制，512MB。大多数时候应该避免使用非常大的字符串值，这本身就很不符合业务逻辑，还会带来很多潜在又难以分析的问题，如果说某些数据缺失超过了512MB，这个时候应该考虑的时如何拆分key，将数据进行分散，而不是堆积到一个非常大的key上。



#### 2.2、list（列表）

##### 2.2.0、常用场景

- 消息队列的功能，push+ brpop命令实现阻塞队列
- 分页查询功能，对于某些查询数据的缓存，也可以使用list来存储，然后通过`lrange key 0 19`进行分页数据的获取。不过一般非必要的数据的不会直接在redis中去做查询过滤操作，更多时候redis是单纯用作一个数据的缓存。

实现所用的数据结构，双向链表。

```
typedef struct listNode {
    struct listNode *prev;
    struct listNode *next;
    void *value;
} listNode;

typedef struct listIter {
    listNode *next;
    int direction;
} listIter;

typedef struct list {
    listNode *head;
    listNode *tail;
    void *(*dup)(void *ptr);
    void (*free)(void *ptr);
    int (*match)(void *ptr, void *key);
    unsigned long len;
} list;
```

常见链表操作这里就不说了。



#### 2.3、hash（字典）

##### 2.3.0、常用场景

- 一些数据变更频繁的场景，比兔用户信息，订单信息等，
- 购物车功能，比如使用id作为key存储，或者商品编码商品信息等。



##### 2.3.1、实现原理

​	基本实现就是哈希表 + 链表。需要注意的是，和jdk中的hashmap链表实现方式有所不同，节点是一个Entry数组，每个Entry是一个链表。

```
struct dict {
    dictType *type;

    dictEntry **ht_table[2];
    unsigned long ht_used[2];

    long rehashidx; /* rehashing not in progress if rehashidx == -1 */

    /* Keep small vars at end for optimal (minimal) struct padding */
    unsigned pauserehash : 15; /* If >0 rehashing is paused */

    unsigned useStoredKeyApi : 1; /* See comment of storedHashFunction above */
    signed char ht_size_exp[2]; /* exponent of size. (size = 1<<exp) */
    int16_t pauseAutoResize;  /* If >0 automatic resizing is disallowed (<0 indicates coding error) */
    void *metadata[];
};
```

```
struct dictEntry {
    void *key;
    union {
        void *val;
        uint64_t u64;
        int64_t s64;
        double d;
    } v;
    struct dictEntry *next;     /* Next entry in the same hash bucket. */
};

typedef struct {
    void *key;
    dictEntry *next;
} dictEntryNoValue;
```

具体使用的hash算法，MummurHash2，没具体了解过，有空再补充下。



#### 2.4、set（集合）

##### 2.4.0、常用场景

- 社交类功能，比如共同的好友。（可能不一定适合）
- 统计访问网站的IP地址
- 抽奖功能，通过set中返回随机的元素。

#### 2.5、有序集合

##### 2.5.0、常用场景

- 有序数据集合的需求，比如积分排行榜功能。换个更简单的说法，需要使用优先队列作为缓存的地方可以使用这个实现。

### 三、不常用的redis数据结构（redis底层数据结构，上面常用数据结构的内部实现所用）

#### 3.1、跳跃表

##### 3.1.0、常用场景

- 有序集合，区间统计之类的场景

跳跃表是一种随机化的数据结构，通过在有序链表上添加多级索引，实现快速的查找、插入和删除操作。基本思想是在每个节点上随机增加前进指针，从而形成多层链表，提供更快的访问路径。

#### 3.2、压缩列表

##### 3.2.0、常用场景

- 小哈希表，短列表，小有序集合。主要为了提高内存的利用率。

压缩列表是一种内存紧凑的顺序数据结构，通过连续的内存块存储多个元素，最大限度地减少内存碎片和开销。

