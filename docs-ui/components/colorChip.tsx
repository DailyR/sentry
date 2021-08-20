import {Component} from 'react';
import styled from '@emotion/styled';
import Color from 'color';

type Props = {
  value: string;
};

type State = {
  color: Color;
  displayType: 'hex' | 'hsl' | 'rgb';
};

class ColorChip extends Component<Props, State> {
  state: State = {
    displayType: 'hex',
    color: Color(this.props.value),
  };

  render() {
    const {color} = this.state;

    return (
      <Wrapper>
        <ColorSwatch background={color && color.hex()} />
        <Text>{color && color.hex()}</Text>
      </Wrapper>
    );
  }
}

export default ColorChip;

const Wrapper = styled('div')`
  display: inline-flex;
  align-items: center;
  border: solid 1px ${p => p.theme.gray100};
  border-radius: ${p => p.theme.borderRadius};
  padding: 2px 0.25em 2px 2px;
  transform: translateY(0.25em);
  cursor: pointer;
  &:hover {
    background-color: ${p => p.theme.gray100};
  }
`;

const Text = styled('p')`
  line-height: 1;
  margin-bottom: 0;
`;

const ColorSwatch = styled('div')`
  width: 1.2em;
  height: 1.2em;
  border-radius: ${p => p.theme.borderRadius};
  background-color: ${p => p.background};
  border: solid 1px ${p => p.theme.gray100};
  margin-right: 0.25em;
`;
