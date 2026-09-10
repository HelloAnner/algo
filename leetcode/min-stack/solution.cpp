// 最小栈（原文档小节「最大栈」，716 为会员题，此处实现同型的最小栈）
// https://leetcode.cn/problems/min-stack/
//
// 思路：双栈，data 存数据，minStack 单调非增地存到当前位置为止的最小值。
// 复杂度：时间 O(1)/次操作 空间 O(q)
#include <iostream>
#include <stack>
#include <string>

using namespace std;

class MinStack {
  public:
    void push(int val) {
        data_.push(val);
        // 注意是 <=：相等的元素也要压入，否则弹出时会丢掉最小值
        if (minStack_.empty() || val <= minStack_.top()) minStack_.push(val);
    }

    void pop() {
        int x = data_.top();
        data_.pop();
        if (!minStack_.empty() && minStack_.top() == x) minStack_.pop();
    }

    int top() const { return data_.top(); }

    int getMin() const { return minStack_.top(); }

  private:
    stack<int> data_;
    stack<int> minStack_;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int q;
    if (!(cin >> q)) return 0;

    MinStack st;
    string op;
    while (q-- > 0) {
        cin >> op;
        if (op == "push") {
            int x = 0;
            cin >> x;
            st.push(x);
        } else if (op == "pop") {
            st.pop();
        } else if (op == "top") {
            cout << st.top() << '\n';
        } else if (op == "getMin") {
            cout << st.getMin() << '\n';
        }
    }
    return 0;
}
