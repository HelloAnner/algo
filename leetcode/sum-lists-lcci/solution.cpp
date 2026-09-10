// 链表求和（面试题 02.05）
// https://leetcode.cn/problems/sum-lists-lcci/
//
// 思路：两条链表都是个位在首部，从头同步遍历，逐位相加并维护进位，用哑结点尾插结果链表。
// 复杂度：时间 O(max(n, m)) 空间 O(1)（不含结果链表）
#include <algorithm>
#include <iostream>
#include <vector>

using namespace std;

struct ListNode {
    int val;
    ListNode *next;
    explicit ListNode(int v) : val(v), next(nullptr) {}
};

// 把数组里的数位按顺序建成链表；节点内存统一放在 pool 中，省去手工 new/delete
ListNode *buildList(const vector<int> &digits, vector<ListNode> &pool) {
    ListNode dummy(0);
    ListNode *tail = &dummy;
    for (int d : digits) {
        pool.emplace_back(d);
        tail->next = &pool.back();
        tail = tail->next;
    }
    return dummy.next;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    if (!(cin >> n)) return 0;
    vector<int> a(n);
    for (int &x : a) cin >> x;
    cin >> m;
    vector<int> b(m);
    for (int &x : b) cin >> x;

    // pool 预留足够空间：两条链表 + 结果链表（最长 max(n, m) + 1 位）
    vector<ListNode> pool;
    pool.reserve(n + m + max(n, m) + 1);
    ListNode *l1 = buildList(a, pool);
    ListNode *l2 = buildList(b, pool);

    ListNode dummy(0);
    ListNode *tail = &dummy;
    int carry = 0;
    while (l1 != nullptr || l2 != nullptr || carry != 0) {
        int sum = carry;
        if (l1 != nullptr) { sum += l1->val; l1 = l1->next; }
        if (l2 != nullptr) { sum += l2->val; l2 = l2->next; }
        pool.emplace_back(sum % 10);
        tail->next = &pool.back();
        tail = tail->next;
        carry = sum / 10;
    }

    bool first = true;
    for (ListNode *p = dummy.next; p != nullptr; p = p->next) {
        if (!first) cout << ' ';
        first = false;
        cout << p->val;
    }
    cout << '\n';
    return 0;
}
