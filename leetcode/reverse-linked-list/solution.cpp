// 反转链表
// https://leetcode.cn/problems/reverse-linked-list/
//
// 思路：迭代反转单链表，pre/cur 双指针逐个把节点头插到已反转部分前面。
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

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n) || n <= 0) {
        // 空链表：直接输出空行
        cout << '\n';
        return 0;
    }

    // 用 unique_ptr 池持有所有节点，避免手写 delete，也保证不泄漏
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

    // 迭代反转：pre 指向已反转部分的头，cur 指向未处理部分的头
    ListNode *pre = nullptr;
    ListNode *cur = head;
    while (cur != nullptr) {
        ListNode *nxt = cur->next;  // 先存后继，防止断链
        cur->next = pre;
        pre = cur;
        cur = nxt;
    }
    head = pre;

    for (ListNode *p = head; p != nullptr; p = p->next) {
        if (p != head) cout << ' ';
        cout << p->val;
    }
    cout << '\n';
    return 0;
}
