// K 个一组翻转链表
// https://leetcode.cn/problems/reverse-nodes-in-k-group/
//
// 思路：哨兵节点 + 每 k 个一组截断后迭代反转，不足 k 个的尾部保持原序。
// 复杂度：时间 O(n) 空间 O(1)
#include <iostream>
#include <memory>
#include <vector>

using namespace std;

struct ListNode {
    int val;
    ListNode *next;
    explicit ListNode(int v) : val(v), next(nullptr) {}
};

// 反转一条以 head 开头、以 nullptr 结尾的链表，返回新的头
static ListNode *reverseAll(ListNode *head) {
    ListNode *pre = nullptr;
    while (head != nullptr) {
        ListNode *nxt = head->next;
        head->next = pre;
        pre = head;
        head = nxt;
    }
    return pre;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, k;
    if (!(cin >> n >> k) || n <= 0) {
        cout << '\n';
        return 0;
    }

    // 用 unique_ptr 池持有节点，指针随便改，内存不泄漏
    vector<unique_ptr<ListNode>> pool;
    pool.reserve(n);

    ListNode *head = nullptr;
    ListNode *tail = nullptr;
    for (int i = 0; i < n; ++i) {
        int v;
        cin >> v;
        pool.push_back(make_unique<ListNode>(v));
        ListNode *node = pool.back().get();
        if (tail == nullptr) {
            head = node;
        } else {
            tail->next = node;
        }
        tail = node;
    }

    ListNode dummy(0);
    dummy.next = head;
    ListNode *pre = &dummy;  // 已翻转部分的尾节点
    ListNode *cur = head;    // 当前待处理组的第一个节点

    while (cur != nullptr) {
        // 找本组的尾节点
        ListNode *groupTail = cur;
        for (int i = 1; i < k && groupTail != nullptr; ++i) {
            groupTail = groupTail->next;
        }
        if (groupTail == nullptr) break;  // 不足 k 个，保持原有顺序

        ListNode *nxt = groupTail->next;  // 下一组的开头
        groupTail->next = nullptr;        // 截断成独立链表
        pre->next = reverseAll(cur);      // 反转本组并接回
        cur->next = nxt;                  // 反转后 cur 已是本组尾部
        pre = cur;
        cur = nxt;
    }

    for (ListNode *p = dummy.next; p != nullptr; p = p->next) {
        if (p != dummy.next) cout << ' ';
        cout << p->val;
    }
    cout << '\n';
    return 0;
}
