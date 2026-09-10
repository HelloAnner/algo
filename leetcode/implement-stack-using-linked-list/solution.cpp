// 用链表实现栈
// 字节跳动面试手写题（《手撕字节跳动面试时出现过的算法题》第 84 题）
//
// 思路：单链表 + 头插法，链表头就是栈顶，push / pop / top / empty / size 都是 O(1)。
//       文档的 Java 版本用双向链表 + 尾指针，这里用更简单的单向链表。
// 复杂度：各操作时间 O(1) 空间 O(k)（k 为栈内元素个数）
#include <iostream>
#include <string>

using namespace std;

struct Node {
    int val;
    Node *next;
    explicit Node(int v) : val(v), next(nullptr) {}
};

class LinkedStack {
public:
    LinkedStack() : head_(nullptr), size_(0) {}

    ~LinkedStack() {
        while (head_ != nullptr) {
            Node *dead = head_;
            head_ = head_->next;
            delete dead;
        }
    }

    // 头插：新节点成为新的栈顶
    void push(int v) {
        Node *node = new Node(v);
        node->next = head_;
        head_ = node;
        ++size_;
    }

    int top() const { return head_->val; }

    int pop() {
        Node *dead = head_;
        int v = dead->val;
        head_ = dead->next;
        delete dead;
        --size_;
        return v;
    }

    bool empty() const { return head_ == nullptr; }

    int size() const { return size_; }

private:
    Node *head_;
    int size_;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int q;
    if (!(cin >> q)) return 0;

    LinkedStack st;
    string op;
    for (int i = 0; i < q; ++i) {
        cin >> op;
        if (op == "push") {
            int x;
            cin >> x;
            st.push(x);
        } else if (op == "pop") {
            cout << st.pop() << '\n';
        } else if (op == "top") {
            cout << st.top() << '\n';
        } else if (op == "empty") {
            cout << (st.empty() ? "true" : "false") << '\n';
        } else if (op == "size") {
            cout << st.size() << '\n';
        }
    }
    return 0;
}
