import {mountWithTheme} from 'sentry-test/reactTestingLibrary';

import {Client} from 'app/api';
import withApi from 'app/utils/withApi';

describe('withApi', function () {
  let apiInstance: Client | undefined;

  type Props = {
    /**
     * Test passthrough API clients
     */
    api?: Client;
  };

  const MyComponent = jest.fn((props: Props) => {
    apiInstance = props.api;
    return <div />;
  });

  it('renders MyComponent with an api prop', function () {
    const MyComponentWithApi = withApi(MyComponent);
    mountWithTheme(<MyComponentWithApi />);

    expect(MyComponent).toHaveBeenCalledWith(
      expect.objectContaining({api: apiInstance}),
      expect.anything()
    );
  });

  it('cancels pending API requests when component is unmounted', async function () {
    const MyComponentWithApi = withApi(MyComponent);
    const wrapper = mountWithTheme(<MyComponentWithApi />);

    if (apiInstance === undefined) {
      throw new Error("apiInstance wasn't defined");
    }

    jest.spyOn(apiInstance, 'clear');

    expect(apiInstance?.clear).not.toHaveBeenCalled();
    wrapper.unmount();

    expect(apiInstance?.clear).toHaveBeenCalled();
  });
});
